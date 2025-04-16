import pool from '@/lib/db';

export default async function handler(req, res) {
    const connection = await pool.getConnection();
    
    try {
        await connection.beginTransaction();

        // Check for expired medicines on every request
        const [expired] = await connection.query(
            'SELECT * FROM medicines WHERE expiry_date < CURDATE()'
        );
        
        if (expired.length > 0) {
            // Move expired medicines to expired_medicines table
            await connection.query(
                `INSERT INTO expired_medicines 
                (original_item_no, drug_description, brand_name, lot_batch_no, expiry_date, physical_balance)
                VALUES ?`,
                [expired.map(med => [
                    med.item_no,
                    med.drug_description,
                    med.brand_name,
                    med.lot_batch_no,
                    med.expiry_date,
                    med.physical_balance
                ])]
            );
            
            // Remove from active medicines
            await connection.query(
                'DELETE FROM medicines WHERE item_no IN (?)',
                [expired.map(med => med.item_no)]
            );
        }

        switch (req.method) {
            case 'GET': {
                const searchQuery = req.query.search?.trim() || "";

                let query = "SELECT * FROM medicines";
                let queryParams = [];

                if (searchQuery) {
                    query += " WHERE brand_name LIKE ? OR drug_description LIKE ?";
                    queryParams = [`%${searchQuery}%`, `%${searchQuery}%`];
                }

                query += " ORDER BY item_no ASC";
                const [rows] = await connection.query(query, queryParams);

                await connection.commit();
                return res.status(200).json(rows);
            }

            case 'POST': {
                const { drug_description, brand_name, lot_batch_no, expiry_date, physical_balance } = req.body;

                if (!drug_description || !brand_name || !lot_batch_no || !expiry_date || isNaN(physical_balance)) {
                    await connection.rollback();
                    return res.status(400).json({ error: 'All fields are required, and physical_balance must be a number' });
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
                    physical_balance 
                });
            }

            case 'PUT': {
                const { item_no, drug_description, brand_name, lot_batch_no, expiry_date, physical_balance } = req.body;

                if (!item_no || !drug_description || !brand_name || !lot_batch_no || !expiry_date || isNaN(physical_balance)) {
                    await connection.rollback();
                    return res.status(400).json({ error: 'All fields are required, and physical_balance must be a number' });
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
                return res.status(200).json({ message: 'Medicine updated successfully' });
            }

            case 'DELETE': {
                const item_no = req.query.item_no?.trim();

                if (!item_no) {
                    await connection.rollback();
                    return res.status(400).json({ error: 'Item No. is required' });
                }

                // First get the medicine details before deleting
                const [medicine] = await connection.query(
                    'SELECT * FROM medicines WHERE item_no = ?',
                    [item_no]
                );

                if (medicine.length === 0) {
                    await connection.rollback();
                    return res.status(404).json({ error: 'Medicine not found' });
                }

                // Delete from medicines table
                const [result] = await connection.query(
                    'DELETE FROM medicines WHERE item_no=?',
                    [item_no]
                );

                // Optionally archive the deleted medicine
                await connection.query(
                    `INSERT INTO expired_medicines 
                    (original_item_no, drug_description, brand_name, lot_batch_no, expiry_date, physical_balance, reason)
                    VALUES (?, ?, ?, ?, ?, ?, ?)`,
                    [
                        item_no,
                        medicine[0].drug_description,
                        medicine[0].brand_name,
                        medicine[0].lot_batch_no,
                        medicine[0].expiry_date,
                        medicine[0].physical_balance,
                        'Manually deleted'
                    ]
                );

                await connection.commit();
                return res.status(200).json({ message: 'Medicine deleted successfully' });
            }

            default:
                await connection.rollback();
                res.setHeader('Allow', ['GET', 'POST', 'PUT', 'DELETE']);
                return res.status(405).json({ error: `Method ${req.method} not allowed` });
        }
    } catch (error) {
        await connection.rollback();
        console.error('Database error:', error);
        return res.status(500).json({ error: 'Internal Server Error', details: error.message });
    } finally {
        connection.release();
    }
}