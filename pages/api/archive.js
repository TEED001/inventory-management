import pool from '@/lib/db';

export default async function handler(req, res) {
    const connection = await pool.getConnection();
    
    try {
        await connection.beginTransaction();

        switch (req.method) {
            case 'GET': {
                // Get all archived records with pagination, search, and filtering
                const { 
                    page = 1, 
                    limit = 50, 
                    search = '', 
                    type = '',
                    sort = 'archived_at',
                    order = 'DESC'
                } = req.query;
                
                const offset = (page - 1) * limit;
                const validSortColumns = ['archived_at', 'expiry_date', 'brand_name', 'drug_description'];
                const sortColumn = validSortColumns.includes(sort) ? sort : 'archived_at';
                const sortOrder = order.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';

                let whereClause = 'WHERE 1=1';
                const params = [];

                if (search) {
                    whereClause += ' AND (a.drug_description LIKE ? OR a.brand_name LIKE ? OR a.lot_batch_no LIKE ?)';
                    params.push(`%${search}%`, `%${search}%`, `%${search}%`);
                }

                if (type && ['active', 'expired'].includes(type)) {
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

            case 'POST': {
                // Archive a record (from either active or expired tables)
                const { 
                    id, 
                    type, 
                    reason = 'Manually archived', 
                    archived_by = null 
                } = req.body;
                
                if (!id || !type || !['active', 'expired'].includes(type)) {
                    await connection.rollback();
                    return res.status(400).json({ 
                        success: false,
                        error: 'Valid id and type (active/expired) are required' 
                    });
                }

                let sourceTable, record;
                
                if (type === 'active') {
                    // Get from medicines table
                    [record] = await connection.query(
                        'SELECT * FROM medicines WHERE item_no = ? FOR UPDATE',
                        [id]
                    );
                    sourceTable = 'medicines';
                } else {
                    // Get from expired_medicines table
                    [record] = await connection.query(
                        'SELECT * FROM expired_medicines WHERE id = ? AND is_archived = 0 FOR UPDATE',
                        [id]
                    );
                    sourceTable = 'expired_medicines';
                }
                
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
                    await connection.query(
                        'DELETE FROM medicines WHERE item_no = ?',
                        [id]
                    );
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

            case 'PUT': {
                // Restore a record to either active or expired
                const { 
                    id, 
                    restoreTo, 
                    restored_by = null,
                    newExpiryDate = null // Optional: allow updating expiry date when restoring
                } = req.body;
                
                if (!id || !restoreTo || !['active', 'expired'].includes(restoreTo)) {
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
                await connection.query(
                    'DELETE FROM archived_medicines WHERE id = ?',
                    [id]
                );

                await connection.commit();
                return res.status(200).json({ 
                    success: true,
                    message: 'Record restored successfully',
                    restored_to: restoreTo,
                    restored_at: new Date().toISOString(),
                    restored_by
                });
            }

            default:
                await connection.rollback();
                res.setHeader('Allow', ['GET', 'POST', 'PUT']);
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
            details: error.message
        });
    } finally {
        connection.release();
    }
}