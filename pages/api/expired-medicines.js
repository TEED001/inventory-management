import pool from '@/lib/db';

// Constants for configuration
const DEFAULT_PAGE = 1;
const DEFAULT_LIMIT = 50;
const VALID_SORT_COLUMNS = new Set(['expiry_date', 'expired_at', 'brand_name', 'drug_description']);
const DEFAULT_SORT_COLUMN = 'expiry_date';
const DEFAULT_SORT_ORDER = 'DESC';

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

// Helper function to build WHERE clause for queries
function buildWhereClause(search = '', archived = '') {
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

    return { whereClause, params };
}

// Restore unexpired medicines
async function handleRestoreUnexpired(connection) {
    const [unexpired] = await connection.query(
        `SELECT * FROM expired_medicines 
        WHERE expiry_date > CURDATE() AND is_archived = 0`
    );
    
    if (unexpired.length === 0) return;

    // Prepare batch insert values
    const values = unexpired.map(med => [
        med.original_item_no,
        med.drug_description,
        med.brand_name,
        med.lot_batch_no,
        med.expiry_date,
        med.physical_balance
    ]);

    // Transactionally move back to medicines table
    await connection.query(
        `INSERT INTO medicines 
        (item_no, drug_description, brand_name, lot_batch_no, expiry_date, physical_balance)
        VALUES ?`,
        [values]
    );
    
    // Remove from expired_medicines
    await connection.query(
        'DELETE FROM expired_medicines WHERE id IN (?)',
        [unexpired.map(med => med.id)]
    );
}

// GET - Retrieve expired medicines
async function handleGetExpired(connection, req, res) {
    const { 
        page = DEFAULT_PAGE, 
        limit = DEFAULT_LIMIT, 
        search = '', 
        archived = '',
        sort = DEFAULT_SORT_COLUMN,
        order = DEFAULT_SORT_ORDER
    } = req.query;
    
    const offset = (page - 1) * limit;
    const sortColumn = VALID_SORT_COLUMNS.has(sort) ? sort : DEFAULT_SORT_COLUMN;
    const sortOrder = order.toUpperCase() === 'ASC' ? 'ASC' : DEFAULT_SORT_ORDER;

    const { whereClause, params } = buildWhereClause(search, archived);

    // Execute both queries in parallel for better performance
    const [rows, [count]] = await Promise.all([
        connection.query(
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
            ORDER BY ${connection.escapeId(sortColumn)} ${sortOrder}
            LIMIT ? OFFSET ?`,
            [...params, Number(limit), Number(offset)]
        ),
        connection.query(
            `SELECT COUNT(*) as total FROM expired_medicines ${whereClause}`,
            params
        )
    ]);

    await connection.commit();
    return res.status(200).json({
        data: rows[0],
        pagination: {
            page: Number(page),
            limit: Number(limit),
            total: count.total,
            totalPages: Math.ceil(count.total / limit)
        },
        sort: {
            column: sortColumn,
            direction: sortOrder
        }
    });
}

// POST - Manually expire a medicine
async function handlePostExpired(connection, req, res) {
    const { item_no, reason = 'Manually expired' } = req.body;
    
    if (!item_no) {
        await connection.rollback();
        return res.status(400).json({ error: 'Item No. is required' });
    }

    // Execute all validation checks in a single transaction
    const [medicine, [isExpired], [alreadyExpired]] = await Promise.all([
        connection.query('SELECT * FROM medicines WHERE item_no = ? FOR UPDATE', [item_no]),
        connection.query('SELECT 1 FROM medicines WHERE item_no = ? AND expiry_date <= CURDATE()', [item_no]),
        connection.query('SELECT 1 FROM expired_medicines WHERE original_item_no = ? AND is_archived = 0', [item_no])
    ]);

    // Validate checks
    if (medicine.length === 0) {
        await connection.rollback();
        return res.status(404).json({ error: 'Medicine not found' });
    }

    if (isExpired.length === 0) {
        await connection.rollback();
        return res.status(400).json({ 
            error: 'Cannot expire medicine',
            details: 'Medicine expiry date is in the future'
        });
    }

    if (alreadyExpired.length > 0) {
        await connection.rollback();
        return res.status(409).json({ error: 'This medicine is already in the expired list' });
    }

    const med = medicine[0];
    const [result] = await connection.query(
        `INSERT INTO expired_medicines 
        (original_item_no, drug_description, brand_name, 
         lot_batch_no, expiry_date, physical_balance, reason)
        VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [med.item_no, med.drug_description, med.brand_name, 
         med.lot_batch_no, med.expiry_date, med.physical_balance, reason]
    );

    // Remove from active medicines
    await connection.query('DELETE FROM medicines WHERE item_no = ?', [item_no]);

    await connection.commit();
    return res.status(201).json({ 
        message: 'Medicine moved to expired list',
        expired_id: result.insertId,
        expired_at: new Date().toISOString(),
        original_item_no: med.item_no
    });
}

// PUT - Update expired medicine details
async function handlePutExpired(connection, req, res) {
    const { id, ...updates } = req.body;
    
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

    // Update medicine details
    await connection.query(
        `UPDATE expired_medicines 
        SET ?
        WHERE id = ?`,
        [updates, id]
    );

    await connection.commit();
    return res.status(200).json({ 
        message: 'Medicine updated successfully',
        data: { id, ...updates }
    });
}

// DELETE - Permanently delete an expired medicine
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

    const med = expired[0];
    
    // Check if medicine should be restored instead of deleted
    if (new Date(med.expiry_date) > new Date()) {
        await connection.rollback();
        return res.status(400).json({ 
            error: 'Cannot delete medicine',
            details: 'Medicine expiry date is in the future - it should be restored instead'
        });
    }

    // Archive the record if not already archived
    if (!med.is_archived) {
        try {
            await connection.query(
                `INSERT INTO archived_medicines 
                (original_item_no, drug_description, brand_name, 
                 lot_batch_no, expiry_date, physical_balance, 
                 reason, type, archived_at)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                [
                    med.original_item_no,
                    med.drug_description,
                    med.brand_name,
                    med.lot_batch_no,
                    med.expiry_date,
                    med.physical_balance,
                    med.reason || 'Expired',
                    'expired',
                    new Date()
                ]
            );
        } catch (error) {
            await connection.rollback();
            console.error('Archive failed:', error);
            return res.status(500).json({ 
                error: 'Failed to archive medicine',
                details: error.message
            });
        }
    }

    // Delete from expired_medicines
    await connection.query('DELETE FROM expired_medicines WHERE id = ?', [id]);

    await connection.commit();
    return res.status(200).json({ 
        message: 'Expired medicine permanently deleted',
        deleted_item: {
            id: med.id,
            original_item_no: med.original_item_no,
            brand_name: med.brand_name
        }
    });
}