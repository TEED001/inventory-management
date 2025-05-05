import pool from '@/lib/db';

// Configuration constants
const DEFAULT_PAGINATION = {
    page: 1,
    limit: 50
};
const SEARCH_FIELDS = ['brand_name', 'drug_description', 'lot_batch_no'];

export default async function handler(req, res) {
    const connection = await pool.getConnection();
    
    try {
        await connection.beginTransaction();

        // Only check for expired medicines on GET requests to prevent accidental moves
        if (req.method === 'GET') {
            await handleExpiredMedicines(connection);
        }

        switch (req.method) {
            case 'GET':
                return await handleGetRequest(connection, req, res);
            case 'POST':
                return await handlePostRequest(connection, req, res);
            case 'PUT':
                return await handlePutRequest(connection, req, res);
            case 'DELETE':
                return await handleDeleteRequest(connection, req, res);
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
            ...(process.env.NODE_ENV === 'development' && { stack: error.stack })
        });
    } finally {
        connection.release();
    }
}

// Helper function to handle expired medicines (more conservative version)
async function handleExpiredMedicines(connection) {
    // First verify the expired_medicines table exists
    const [tables] = await connection.query(
        "SHOW TABLES LIKE 'expired_medicines'"
    );
    
    if (tables.length === 0) {
        console.log('expired_medicines table does not exist - skipping expiry check');
        return;
    }

    // Get medicines that expired today or earlier
    const [expired] = await connection.query(
        'SELECT * FROM medicines WHERE expiry_date <= CURDATE()'
    );
    
    if (expired.length === 0) return;

    // Verify the structure of expired_medicines table
    const [columns] = await connection.query(
        "DESCRIBE expired_medicines"
    );
    
    const requiredColumns = ['original_item_no', 'drug_description', 'brand_name', 
                           'lot_batch_no', 'expiry_date', 'physical_balance', 'reason'];
    const columnNames = columns.map(col => col.Field);
    
    const missingColumns = requiredColumns.filter(col => !columnNames.includes(col));
    if (missingColumns.length > 0) {
        console.error('expired_medicines table missing required columns:', missingColumns);
        return;
    }

    // Prepare batch insert
    const values = expired.map(med => [
        med.item_no,
        med.drug_description,
        med.brand_name,
        med.lot_batch_no,
        med.expiry_date,
        med.physical_balance,
        'Auto-expired'
    ]);

    // Move to expired_medicines
    await connection.query(
        `INSERT INTO expired_medicines 
        (original_item_no, drug_description, brand_name, 
         lot_batch_no, expiry_date, physical_balance, reason)
        VALUES ?`,
        [values]
    );
    
    // Remove from active medicines
    await connection.query(
        'DELETE FROM medicines WHERE item_no IN (?)',
        [expired.map(med => med.item_no)]
    );
}

// GET request handler (compatible version)
async function handleGetRequest(connection, req, res) {
    const searchQuery = req.query.search?.trim() || "";
    const showExpired = req.query.expired === 'true';
    const showArchived = req.query.archived === 'true';

    let query, queryParams = [];

    if (showExpired) {
        query = "SELECT * FROM expired_medicines WHERE is_archived = 0";
        if (searchQuery) {
            query += " AND (brand_name LIKE ? OR drug_description LIKE ?)";
            queryParams = [`%${searchQuery}%`, `%${searchQuery}%`];
        }
        query += " ORDER BY expiry_date ASC";
    } 
    else if (showArchived) {
        query = "SELECT * FROM archived_medicines";
        if (searchQuery) {
            query += " WHERE (brand_name LIKE ? OR drug_description LIKE ?)";
            queryParams = [`%${searchQuery}%`, `%${searchQuery}%`];
        }
        query += " ORDER BY archived_at DESC";
    }
    else {
        query = "SELECT * FROM medicines";
        if (searchQuery) {
            query += " WHERE brand_name LIKE ? OR drug_description LIKE ?";
            queryParams = [`%${searchQuery}%`, `%${searchQuery}%`];
        }
        query += " ORDER BY expiry_date ASC";
    }

    const [rows] = await connection.query(query, queryParams);
    await connection.commit();
    return res.status(200).json(rows);
}

// POST request handler (unchanged)
async function handlePostRequest(connection, req, res) {
    const { drug_description, brand_name, lot_batch_no, expiry_date, physical_balance } = req.body;

    if (!drug_description || !brand_name || !lot_batch_no || !expiry_date || isNaN(physical_balance)) {
        await connection.rollback();
        return res.status(400).json({ 
            error: 'All fields are required, and physical_balance must be a number' 
        });
    }

    // Check for duplicates
    const [existing] = await connection.query(
        `SELECT 1 FROM medicines 
        WHERE drug_description = ? AND brand_name = ? AND lot_batch_no = ? 
        LIMIT 1`,
        [drug_description, brand_name, lot_batch_no]
    );

    if (existing.length > 0) {
        await connection.rollback();
        return res.status(409).json({ error: 'This medicine already exists' });
    }

    const formattedDate = new Date(expiry_date).toISOString().split('T')[0];

    const [result] = await connection.query(
        'INSERT INTO medicines (drug_description, brand_name, lot_batch_no, expiry_date, physical_balance) VALUES (?, ?, ?, ?, ?)',
        [drug_description, brand_name, lot_batch_no, formattedDate, Number(physical_balance)]
    );

    await connection.commit();
    return res.status(201).json({ 
        item_no: result.insertId, 
        drug_description, 
        brand_name, 
        lot_batch_no, 
        expiry_date: formattedDate, 
        physical_balance,
        message: 'Medicine added successfully'
    });
}

// PUT request handler (unchanged)
async function handlePutRequest(connection, req, res) {
    const { item_no, drug_description, brand_name, lot_batch_no, expiry_date, physical_balance } = req.body;

    if (!item_no || !drug_description || !brand_name || !lot_batch_no || !expiry_date || isNaN(physical_balance)) {
        await connection.rollback();
        return res.status(400).json({ 
            error: 'All fields are required, and physical_balance must be a number' 
        });
    }

    const formattedDate = new Date(expiry_date).toISOString().split('T')[0];

    const [result] = await connection.query(
        'UPDATE medicines SET drug_description=?, brand_name=?, lot_batch_no=?, expiry_date=?, physical_balance=? WHERE item_no=?',
        [drug_description, brand_name, lot_batch_no, formattedDate, Number(physical_balance), item_no]
    );

    if (result.affectedRows === 0) {
        await connection.rollback();
        return res.status(404).json({ error: 'Medicine not found or no changes made' });
    }

    await connection.commit();
    return res.status(200).json({ 
        message: 'Medicine updated successfully',
        updatedFields: {
            drug_description,
            brand_name,
            lot_batch_no,
            expiry_date: formattedDate,
            physical_balance
        }
    });
}

// DELETE request handler (unchanged)
async function handleDeleteRequest(connection, req, res) {
    const { item_no, reason = "Manually archived", archived_by = null } = req.body;

    if (!item_no) {
        await connection.rollback();
        return res.status(400).json({ error: 'Item No. is required' });
    }

    // Check if medicine exists in active or expired tables
    const [medicine] = await connection.query(
        'SELECT * FROM medicines WHERE item_no = ? FOR UPDATE',
        [item_no]
    );

    const [expiredMedicine] = await connection.query(
        'SELECT * FROM expired_medicines WHERE original_item_no = ? AND is_archived = 0 FOR UPDATE',
        [item_no]
    );

    if (medicine.length === 0 && expiredMedicine.length === 0) {
        await connection.rollback();
        return res.status(404).json({ error: 'Medicine not found' });
    }

    const recordToArchive = medicine.length > 0 ? medicine[0] : expiredMedicine[0];
    const type = medicine.length > 0 ? 'active' : 'expired';

    // Validate we have the original item number
    const originalItemNo = recordToArchive.item_no || recordToArchive.original_item_no;
    if (!originalItemNo) {
        await connection.rollback();
        return res.status(400).json({ 
            error: 'Cannot archive - missing original item number',
            details: `Record ${item_no} has no original_item_no`
        });
    }

    // Archive the medicine
    try {
        const [archiveResult] = await connection.query(
            `INSERT INTO archived_medicines 
            (original_item_no, drug_description, brand_name, 
             lot_batch_no, expiry_date, physical_balance, reason, type, archived_by)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                originalItemNo,
                recordToArchive.drug_description,
                recordToArchive.brand_name,
                recordToArchive.lot_batch_no,
                recordToArchive.expiry_date,
                recordToArchive.physical_balance,
                reason,
                type,
                archived_by
            ]
        );

        // Remove from the appropriate table
        if (medicine.length > 0) {
            await connection.query(
                'DELETE FROM medicines WHERE item_no = ?',
                [item_no]
            );
        } else {
            await connection.query(
                'UPDATE expired_medicines SET is_archived = 1, archived_at = NOW() WHERE id = ?',
                [expiredMedicine[0].id]
            );
        }

        await connection.commit();
        return res.status(200).json({ 
            message: 'Medicine archived successfully',
            archive_id: archiveResult.insertId,
            type
        });
    } catch (error) {
        await connection.rollback();
        console.error('Archive failed:', error);
        return res.status(500).json({ 
            error: 'Failed to archive medicine',
            details: error.message
        });
    }
}