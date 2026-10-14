const db = require('../config/db');

/**
 * GET /api/suppliers
 */
async function getAllSuppliers(req, res, next) {
    try {
        const [rows] = await db.query(`
            SELECT 
                s.SupplierID,
                s.Name,
                s.Phone,
                s.Email,
                s.Address,
                COUNT(b.BatchID) AS TotalBatchesSupplied,
                COALESCE(SUM(b.QtyInHand), 0) AS CurrentStockInStore,
                GROUP_CONCAT(b.BatchNo ORDER BY b.BatchNo SEPARATOR ', ') AS BatchList
            FROM SUPPLIER s
            LEFT JOIN BATCH b ON s.SupplierID = b.SupplierID
            GROUP BY s.SupplierID, s.Name, s.Phone, s.Email, s.Address
            ORDER BY s.Name ASC
        `);
        res.json({ success: true, count: rows.length, data: rows });
    } catch (err) {
        next(err);
    }
}

/**
 * POST /api/suppliers
 */
async function createSupplier(req, res, next) {
    try {
        const { Name, Phone, Email, Address } = req.body;
        if (!Name || !Phone || !Email || !Address) {
            return res.status(400).json({ success: false, message: 'Name, Phone, Email, and Address are required.' });
        }

        const [result] = await db.query(
            'INSERT INTO SUPPLIER (Name, Phone, Email, Address) VALUES (?, ?, ?, ?)',
            [Name, Phone, Email, Address]
        );

        res.status(201).json({
            success: true,
            message: 'Supplier registered successfully.',
            data: { SupplierID: result.insertId, Name, Phone, Email, Address }
        });
    } catch (err) {
        next(err);
    }
}

module.exports = {
    getAllSuppliers,
    createSupplier
};
