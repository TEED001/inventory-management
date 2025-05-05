import pool from '@/lib/db';

// Constants for reusable values
const VALID_TYPES = ['active', 'expired'];
const VALID_SORT_COLUMNS = ['archived_at', 'expiry_date', 'brand_name', 'drug_description'];
const DEFAULT_LIMIT = 50;
const DEFAULT_SORT = 'archived_at';
const DEFAULT_ORDER = 'DESC';

// Helper functions
const validateType = (type) => VALID_TYPES.includes(type);
const validateSortColumn = (column) => VALID_SORT_COLUMNS.includes(column) ? column : DEFAULT_SORT;
const validateSortOrder = (order) => order.toUpperCase() === 'ASC' ? 'ASC' : DEFAULT_ORDER;

export default async function handler(req, res) {
    const connection = await pool.getConnection();
    
    try {
        await connection.beginTransaction();

        switch (req.method) {
            case 'GET':
                await handleGetRequest(req, res, connection);
                break;
            case 'POST':
                await handlePostRequest(req, res, connection);
                break;
            case 'PUT':
                await handlePutRequest(req, res, connection);
                break;
            case 'DELETE':
                await handleDeleteRequest(req, res, connection);
                break;
            default:
                await connection.rollback();
                res.setHeader('Allow', ['GET', 'POST', 'PUT', 'DELETE']);
                return res.status(405).json({ 
                    success: false,
                    error: `Method ${req.method} not allowed` 
                });
        }
    } catch (error) {
        await connection.rollback();
        console.error('Archive error:', error);
        return res.status(500).json({ 
            success: false,
            error: 'Database operation failed',
            details: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    } finally {
        connection.release();
    }
}

// Request handlers
async function handleGetRequest(req, res, connection) {
    const { 
        page = 1, 
        limit = DEFAULT_LIMIT, 
        search = '', 
        type = '',
        sort = DEFAULT_SORT,
        order = DEFAULT_ORDER
    } = req.query;
    
    const offset = (page - 1) * limit;
    const sortColumn = validateSortColumn(sort);
    const sortOrder = validateSortOrder(order);

    let whereClause = 'WHERE 1=1';
    const params = [];

    if (search) {
        whereClause += ' AND (a.drug_description LIKE ? OR a.brand_name LIKE ? OR a.lot_batch_no LIKE ?)';
        params.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }

    if (type && validateType(type)) {
        whereClause += ' AND a.type = ?';
        params.push(type);
    }

    // Get archived items with sorting
    const [archived] = await connection.query(
        `SELECT 
            a.id,
            a.original_item_no,
            a.drug_description,
            a.brand_name,
            a.lot_batch_no,
            a.expiry_date,
            a.physical_balance,
            a.reason,
            a.type,
            a.archived_at,
            a.archived_by
        FROM archived_medicines a
        ${whereClause}
        ORDER BY a.${sortColumn} ${sortOrder}
        LIMIT ? OFFSET ?`,
        [...params, Number(limit), Number(offset)]
    );

    // Get total count
    const [total] = await connection.query(
        `SELECT COUNT(*) as count 
        FROM archived_medicines a
        ${whereClause}`,
        params
    );

    await connection.commit();
    return res.status(200).json({
        success: true,
        data: archived,
        pagination: {
            page: Number(page),
            limit: Number(limit),
            total: total[0].count,
            totalPages: Math.ceil(total[0].count / limit)
        },
        sort: {
            column: sortColumn,
            direction: sortOrder
        }
    });
}

async function handlePostRequest(req, res, connection) {
    const { 
        id, 
        type, 
        reason = 'Manually archived', 
        archived_by = null 
    } = req.body;
    
    if (!id || !type || !validateType(type)) {
        await connection.rollback();
        return res.status(400).json({ 
            success: false,
            error: 'Valid id and type (active/expired) are required' 
        });
    }

    const sourceTable = type === 'active' ? 'medicines' : 'expired_medicines';
    const query = type === 'active' 
        ? 'SELECT * FROM medicines WHERE item_no = ? FOR UPDATE'
        : 'SELECT * FROM expired_medicines WHERE id = ? AND is_archived = 0 FOR UPDATE';

    const [record] = await connection.query(query, [id]);
    
    if (record.length === 0) {
        await connection.rollback();
        return res.status(404).json({ 
            success: false,
            error: `${type === 'active' ? 'Active' : 'Expired'} medicine not found` 
        });
    }

    const medicine = record[0];
    const originalItemNo = type === 'active' ? medicine.item_no : medicine.original_item_no;

    // Insert into archived_medicines
    const [archiveResult] = await connection.query(
        `INSERT INTO archived_medicines 
        (original_item_no, drug_description, brand_name, lot_batch_no, 
         expiry_date, physical_balance, reason, type, archived_by)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
            originalItemNo,
            medicine.drug_description,
            medicine.brand_name,
            medicine.lot_batch_no,
            medicine.expiry_date,
            medicine.physical_balance,
            reason,
            type,
            archived_by
        ]
    );

    // Remove from source table
    if (type === 'active') {
        await connection.query('DELETE FROM medicines WHERE item_no = ?', [id]);
    } else {
        await connection.query(
            'UPDATE expired_medicines SET is_archived = 1, archived_at = NOW() WHERE id = ?',
            [id]
        );
    }
    
    await connection.commit();
    return res.status(200).json({ 
        success: true,
        message: 'Record archived successfully',
        archive_id: archiveResult.insertId,
        archived_at: new Date().toISOString()
    });
}

async function handlePutRequest(req, res, connection) {
    const { 
        id, 
        restoreTo, 
        restored_by = null,
        newExpiryDate = null
    } = req.body;
    
    if (!id || !restoreTo || !validateType(restoreTo)) {
        await connection.rollback();
        return res.status(400).json({ 
            success: false,
            error: 'Valid id and restoreTo (active/expired) are required' 
        });
    }

    // Get archived record with lock
    const [archived] = await connection.query(
        'SELECT * FROM archived_medicines WHERE id = ? FOR UPDATE',
        [id]
    );
    
    if (archived.length === 0) {
        await connection.rollback();
        return res.status(404).json({ 
            success: false,
            error: 'Archived record not found' 
        });
    }

    const archiveRecord = archived[0];
    const expiryDate = newExpiryDate || archiveRecord.expiry_date;

    if (restoreTo === 'active') {
        // Check if medicine already exists
        const [existing] = await connection.query(
            'SELECT 1 FROM medicines WHERE item_no = ?',
            [archiveRecord.original_item_no]
        );

        if (existing.length > 0) {
            await connection.rollback();
            return res.status(409).json({ 
                success: false,
                error: 'Active medicine with this ID already exists' 
            });
        }

        // Restore to medicines table
        await connection.query(
            `INSERT INTO medicines 
            (item_no, drug_description, brand_name, lot_batch_no, expiry_date, physical_balance)
            VALUES (?, ?, ?, ?, ?, ?)`,
            [
                archiveRecord.original_item_no,
                archiveRecord.drug_description,
                archiveRecord.brand_name,
                archiveRecord.lot_batch_no,
                expiryDate,
                archiveRecord.physical_balance
            ]
        );
    } else {
        // Restore to expired_medicines table
        await connection.query(
            `INSERT INTO expired_medicines 
            (original_item_no, drug_description, brand_name, lot_batch_no, 
             expiry_date, physical_balance, reason)
            VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [
                archiveRecord.original_item_no,
                archiveRecord.drug_description,
                archiveRecord.brand_name,
                archiveRecord.lot_batch_no,
                expiryDate,
                archiveRecord.physical_balance,
                'Restored from archive'
            ]
        );
    }

    // Delete from archive
    await connection.query('DELETE FROM archived_medicines WHERE id = ?', [id]);

    await connection.commit();
    return res.status(200).json({ 
        success: true,
        message: 'Record restored successfully',
        restored_to: restoreTo,
        restored_at: new Date().toISOString(),
        restored_by
    });
}

async function handleDeleteRequest(req, res, connection) {
    const { id } = req.query;
    
    if (!id) {
        await connection.rollback();
        return res.status(400).json({ 
            success: false,
            error: 'ID is required for deletion' 
        });
    }

    // Check if record exists
    const [existing] = await connection.query(
        'SELECT 1 FROM archived_medicines WHERE id = ? FOR UPDATE',
        [id]
    );
    
    if (existing.length === 0) {
        await connection.rollback();
        return res.status(404).json({ 
            success: false,
            error: 'Record not found' 
        });
    }

    // Delete the record
    await connection.query('DELETE FROM archived_medicines WHERE id = ?', [id]);
    
    await connection.commit();
    return res.status(200).json({ 
        success: true,
        message: 'Record deleted successfully',
        deleted_id: id
    });
}