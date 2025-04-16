import pool from '@/lib/db';

export default async function handler(req, res) {
    const connection = await pool.getConnection();

    try {
        switch (req.method) {
            case 'GET':
                // Get all expired medicines
                const [rows] = await connection.query(
                    'SELECT * FROM expired_medicines ORDER BY expiry_date DESC'
                );
                res.status(200).json(rows);
                break;

            case 'POST':
                // Manually expire a medicine
                const { item_no, reason } = req.body;
                
                // 1. Get medicine details
                const [medicine] = await connection.query(
                    'SELECT * FROM medicines WHERE item_no = ?',
                    [item_no]
                );
                
                if (medicine.length === 0) {
                    return res.status(404).json({ error: 'Medicine not found' });
                }

                // 2. Add to expired table
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
                        reason || 'Manually expired'
                    ]
                );

                // 3. Remove from active medicines
                await connection.query(
                    'DELETE FROM medicines WHERE item_no = ?',
                    [item_no]
                );

                res.status(201).json({ message: 'Medicine marked as expired' });
                break;

            default:
                res.setHeader('Allow', ['GET', 'POST']);
                res.status(405).json({ error: `Method ${req.method} not allowed` });
        }
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ error: 'Database error', details: error.message });
    } finally {
        connection.release();
    }
}