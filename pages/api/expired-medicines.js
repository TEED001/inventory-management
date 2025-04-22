import pool from '@/lib/db';

export default async function handler(req, res) {
    const connection = await pool.getConnection();
    
    try {
        await connection.beginTransaction();

        // Check for medicines that should be restored (expiry date in future)
        await handleRestoreUnexpired(connection);

        switch (req.method) {
            case 'GET':
                return await handleGetExpired(connection, req, res);
            case 'POST':
                return await handlePostExpired(connection, req, res);
            case 'PUT':
                return await handlePutExpired(connection, req, res);
            case 'DELETE':
                return await handleDeleteExpired(connection, req, res);
            default:
                await connection.rollback();
                res.setHeader('Allow', ['GET', 'POST', 'PUT', 'DELETE']);
                return res.status(405).json({ error: `Method ${req.method} not allowed` });
        }
    } catch (error) {
        await connection.rollback();
        console.error('Database error:', error);
        return res.status(500).json({ 
            error: 'Internal Server Error',
            details: error.message,
            ...(error.sql && { sql: error.sql })
        });
    } finally {
        connection.release();
    }
}

// NEW FUNCTION: Restore unexpired medicines
async function handleRestoreUnexpired(connection) {
    // Get medicines in expired table that are no longer expired
    const [unexpired] = await connection.query(
        `SELECT * FROM expired_medicines 
        WHERE expiry_date > CURDATE() AND is_archived = 0`
    );
    
    if (unexpired.length > 0) {
        // Move back to medicines table
        await connection.query(
            `INSERT INTO medicines 
            (item_no, drug_description, brand_name, lot_batch_no, expiry_date, physical_balance)
            VALUES ?`,
            [unexpired.map(med => [
                med.original_item_no,
                med.drug_description,
                med.brand_name,
                med.lot_batch_no,
                med.expiry_date,
                med.physical_balance
            ])]
        );
        
        // Remove from expired_medicines
        await connection.query(
            'DELETE FROM expired_medicines WHERE id IN (?)',
            [unexpired.map(med => med.id)]
        );
    }
}

// GET - Retrieve expired medicines (updated to exclude unexpired items)
async function handleGetExpired(connection, req, res) {
    const { 
        page = 1, 
        limit = 50, 
        search = '', 
        archived = '',
        sort = 'expiry_date',
        order = 'DESC'
    } = req.query;
    
    const offset = (page - 1) * limit;
    const validSortColumns = ['expiry_date', 'expired_at', 'brand_name', 'drug_description'];
    const sortColumn = validSortColumns.includes(sort) ? sort : 'expiry_date';
    const sortOrder = order.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';

    let whereClause = 'WHERE expiry_date <= CURDATE()'; // Only show truly expired items
    const params = [];

    if (search) {
        whereClause += ' AND (drug_description LIKE ? OR brand_name LIKE ? OR lot_batch_no LIKE ?)';
        params.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }

    if (archived === 'true') {
        whereClause += ' AND is_archived = 1';
    } else if (archived === 'false') {
        whereClause += ' AND is_archived = 0';
    }

    // Main query with sorting
    const [rows] = await connection.query(
        `SELECT 
            id,
            original_item_no,
            drug_description,
            brand_name,
            lot_batch_no,
            expiry_date,
            physical_balance,
            reason,
            expired_at,
            is_archived,
            archived_at
        FROM expired_medicines
        ${whereClause}
        ORDER BY ${sortColumn} ${sortOrder}
        LIMIT ? OFFSET ?`,
        [...params, Number(limit), Number(offset)]
    );

    // Count query for pagination
    const [count] = await connection.query(
        `SELECT COUNT(*) as total FROM expired_medicines ${whereClause}`,
        params
    );

    await connection.commit();
    return res.status(200).json({
        data: rows,
        pagination: {
            page: Number(page),
            limit: Number(limit),
            total: count[0].total,
            totalPages: Math.ceil(count[0].total / limit)
        },
        sort: {
            column: sortColumn,
            direction: sortOrder
        }
    });
}

// POST - Manually expire a medicine (updated with validation)
async function handlePostExpired(connection, req, res) {
    const { item_no, reason = 'Manually expired', archived_by = null } = req.body;
    
    if (!item_no) {
        await connection.rollback();
        return res.status(400).json({ error: 'Item No. is required' });
    }

    // Verify medicine exists and lock the row
    const [medicine] = await connection.query(
        'SELECT * FROM medicines WHERE item_no = ? FOR UPDATE',
        [item_no]
    );
    
    if (medicine.length === 0) {
        await connection.rollback();
        return res.status(404).json({ error: 'Medicine not found' });
    }

    // Check if expiry date is actually expired
    const [isExpired] = await connection.query(
        'SELECT 1 FROM medicines WHERE item_no = ? AND expiry_date <= CURDATE()',
        [item_no]
    );

    if (isExpired.length === 0) {
        await connection.rollback();
        return res.status(400).json({ 
            error: 'Cannot expire medicine',
            details: 'Medicine expiry date is in the future'
        });
    }

    // Check if already expired
    const [alreadyExpired] = await connection.query(
        'SELECT 1 FROM expired_medicines WHERE original_item_no = ? AND is_archived = 0',
        [item_no]
    );

    if (alreadyExpired.length > 0) {
        await connection.rollback();
        return res.status(409).json({ error: 'This medicine is already in the expired list' });
    }

    // Move to expired_medicines
    const [result] = await connection.query(
        `INSERT INTO expired_medicines 
        (original_item_no, drug_description, brand_name, 
         lot_batch_no, expiry_date, physical_balance, reason)
        VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [
            medicine[0].item_no,
            medicine[0].drug_description,
            medicine[0].brand_name,
            medicine[0].lot_batch_no,
            medicine[0].expiry_date,
            medicine[0].physical_balance,
            reason
        ]
    );

    // Remove from active medicines
    await connection.query(
        'DELETE FROM medicines WHERE item_no = ?',
        [item_no]
    );

    await connection.commit();
    return res.status(201).json({ 
        message: 'Medicine moved to expired list',
        expired_id: result.insertId,
        expired_at: new Date().toISOString(),
        original_item_no: medicine[0].item_no
    });
}

// PUT - Archive/Unarchive an expired medicine (updated with validation)
async function handlePutExpired(connection, req, res) {
    const { id, archive = true, archived_by = null } = req.body;
    
    if (!id) {
        await connection.rollback();
        return res.status(400).json({ error: 'Expired medicine ID is required' });
    }

    // Verify the expired medicine exists
    const [expired] = await connection.query(
        'SELECT * FROM expired_medicines WHERE id = ? FOR UPDATE',
        [id]
    );

    if (expired.length === 0) {
        await connection.rollback();
        return res.status(404).json({ error: 'Expired medicine not found' });
    }


    // Check if medicine should be restored instead of archived
    if (new Date(expired[0].expiry_date) > new Date()) {
        await connection.rollback();
        return res.status(400).json({ 
            error: 'Cannot archive medicine',
            details: 'Medicine expiry date is in the future - it should be restored instead'
        });
    }

    if (expired[0].is_archived === (archive ? 1 : 0)) {
        await connection.rollback();
        return res.status(200).json({ 
            message: `Medicine already ${archive ? 'archived' : 'unarchived'}`,
            is_archived: archive
        });
    }

    // Update archive status
    await connection.query(
        `UPDATE expired_medicines 
        SET is_archived = ?, archived_at = ?, archived_by = ?
        WHERE id = ?`,
        [
            archive ? 1 : 0,
            archive ? new Date() : null,
            archive ? archived_by : null,
            id
        ]
    );

    // If archiving, also create a record in archived_medicines
    if (archive) {
        await connection.query(
            `INSERT INTO archived_medicines 
            (original_item_no, drug_description, brand_name, 
             lot_batch_no, expiry_date, physical_balance, 
             reason, type, archived_at, archived_by)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                expired[0].original_item_no,
                expired[0].drug_description,
                expired[0].brand_name,
                expired[0].lot_batch_no,
                expired[0].expiry_date,
                expired[0].physical_balance,
                expired[0].reason || 'Expired',
                'expired',
                new Date(),
                archived_by
            ]
        );
    }

    await connection.commit();
    return res.status(200).json({ 
        message: archive ? 'Medicine archived' : 'Medicine unarchived',
        is_archived: archive,
        archived_at: archive ? new Date().toISOString() : null
    });
}

// DELETE - Permanently delete an expired medicine (updated with validation)
async function handleDeleteExpired(connection, req, res) {
    const { id } = req.query;
    
    if (!id) {
        await connection.rollback();
        return res.status(400).json({ error: 'Expired medicine ID is required' });
    }

    // Verify exists and lock the row
    const [expired] = await connection.query(
        'SELECT * FROM expired_medicines WHERE id = ? FOR UPDATE',
        [id]
    );

    if (expired.length === 0) {
        await connection.rollback();
        return res.status(404).json({ error: 'Expired medicine not found' });
    }

    // Check if medicine should be restored instead of deleted
    if (new Date(expired[0].expiry_date) > new Date()) {
        await connection.rollback();
        return res.status(400).json({ 
            error: 'Cannot delete medicine',
            details: 'Medicine expiry date is in the future - it should be restored instead'
        });
    }

    // First archive the record if not already archived
    if (!expired[0].is_archived) {
        try {
            await connection.query(
                `INSERT INTO archived_medicines 
                (original_item_no, drug_description, brand_name, 
                 lot_batch_no, expiry_date, physical_balance, 
                 reason, type, archived_at)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                [
                    expired[0].original_item_no,
                    expired[0].drug_description,
                    expired[0].brand_name,
                    expired[0].lot_batch_no,
                    expired[0].expiry_date,
                    expired[0].physical_balance,
                    expired[0].reason || 'Expired',
                    'expired',
                    new Date()
                ]
            );
        } catch (error) {
            await connection.rollback();
            console.error('Archive failed:', error);
            return res.status(500).json({ 
                error: 'Failed to archive medicine',
                details: error.message,
                suggestion: 'This usually happens when the original medicine record is missing. Please check the original_item_no reference.'
            });
        }
    }

    // Then delete from expired_medicines
    await connection.query(
        'DELETE FROM expired_medicines WHERE id = ?',
        [id]
    );

    await connection.commit();
    return res.status(200).json({ 
        message: 'Expired medicine permanently deleted',
        deleted_item: {
            id: expired[0].id,
            original_item_no: expired[0].original_item_no,
            brand_name: expired[0].brand_name
        }
    });
}