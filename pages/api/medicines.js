import pool from '@/lib/db';

export default async function handler(req, res) {
    try {
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
                const [rows] = await pool.query(query, queryParams);

                return res.status(200).json(rows);
            }

            case 'POST': {
                const { drug_description, brand_name, lot_batch_no, expiry_date, physical_balance } = req.body;

                if (!drug_description || !brand_name || !lot_batch_no || !expiry_date || isNaN(physical_balance)) {
                    return res.status(400).json({ error: 'All fields are required, and physical_balance must be a number' });
                }

                const formattedDate = new Date(expiry_date).toISOString().split('T')[0];

                const [result] = await pool.query(
                    'INSERT INTO medicines (drug_description, brand_name, lot_batch_no, expiry_date, physical_balance) VALUES (?, ?, ?, ?, ?)',
                    [drug_description, brand_name, lot_batch_no, formattedDate, Number(physical_balance)]
                );

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
                    return res.status(400).json({ error: 'All fields are required, and physical_balance must be a number' });
                }

                const formattedDate = new Date(expiry_date).toISOString().split('T')[0];

                const [result] = await pool.query(
                    'UPDATE medicines SET drug_description=?, brand_name=?, lot_batch_no=?, expiry_date=?, physical_balance=? WHERE item_no=?',
                    [drug_description, brand_name, lot_batch_no, formattedDate, Number(physical_balance), item_no]
                );

                if (result.affectedRows === 0) {
                    return res.status(404).json({ error: 'Medicine not found or no changes made' });
                }

                return res.status(200).json({ message: 'Medicine updated successfully' });
            }

            case 'DELETE': {
                const item_no = req.query.item_no?.trim();

                if (!item_no) return res.status(400).json({ error: 'Item No. is required' });

                const [result] = await pool.query('DELETE FROM medicines WHERE item_no=?', [item_no]);

                if (result.affectedRows === 0) {
                    return res.status(404).json({ error: 'Medicine not found' });
                }

                return res.status(200).json({ message: 'Medicine deleted successfully' });
            }

            default:
                res.setHeader('Allow', ['GET', 'POST', 'PUT', 'DELETE']);
                return res.status(405).json({ error: `Method ${req.method} not allowed` });
        }
    } catch (error) {
        console.error('Database error:', error);
        return res.status(500).json({ error: 'Internal Server Error', details: error.message });
    }
}
