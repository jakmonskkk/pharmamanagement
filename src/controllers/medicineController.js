const db = require('../config/db');

/**
 * GET /api/medicines
 * Lists all medicines with aggregated real-time stock and batch count
 */
async function getAllMedicines(req, res, next) {
    try {
        const { search, category } = req.query;
        let sql = `
            SELECT 
                m.MedicineID,
                m.Name,
                m.Category,
                m.Unit,
                m.Description,
                COUNT(b.BatchID) AS TotalBatches,
                COALESCE(SUM(b.QtyInHand), 0) AS TotalStockInHand,
                COALESCE(MIN(CASE WHEN b.QtyInHand > 0 AND b.ExpiryDate >= CURRENT_DATE THEN b.ExpiryDate END), NULL) AS NextExpiryDate
            FROM MEDICINE m
            LEFT JOIN BATCH b ON m.MedicineID = b.MedicineID
            WHERE 1=1
        `;
        const params = [];

        if (search) {
            sql += ' AND (m.Name LIKE ? OR m.Description LIKE ?)';
            params.push(`%${search}%`, `%${search}%`);
        }

        if (category) {
            sql += ' AND m.Category = ?';
            params.push(category);
        }

        sql += ' GROUP BY m.MedicineID, m.Name, m.Category, m.Unit, m.Description ORDER BY m.Name ASC';

        const [rows] = await db.query(sql, params);
        res.json({ success: true, count: rows.length, data: rows });
    } catch (err) {
        next(err);
    }
}

/**
 * GET /api/medicines/:id
 * Medicine details and all its active batches
 */
async function getMedicineById(req, res, next) {
    try {
        const { id } = req.params;
        const [medicines] = await db.query('SELECT * FROM MEDICINE WHERE MedicineID = ?', [id]);

        if (medicines.length === 0) {
            return res.status(404).json({ success: false, message: 'Medicine not found.' });
        }

        const [batches] = await db.query(`
            SELECT 
                b.BatchID,
                b.BatchNo,
                b.MfgDate,
                b.ExpiryDate,
                DATEDIFF(b.ExpiryDate, CURRENT_DATE) AS DaysUntilExpiry,
                b.CostPrice,
                b.QtyInHand,
                s.Name AS SupplierName
            FROM BATCH b
            JOIN SUPPLIER s ON b.SupplierID = s.SupplierID
            WHERE b.MedicineID = ?
            ORDER BY b.ExpiryDate ASC
        `, [id]);

        res.json({
            success: true,
            data: {
                ...medicines[0],
                batches
            }
        });
    } catch (err) {
        next(err);
    }
}

/**
 * POST /api/medicines
 * Create a new medicine entry in the catalog
 */
async function createMedicine(req, res, next) {
    try {
        const { Name, Category, Unit, Description } = req.body;

        if (!Name || !Category || !Unit) {
            return res.status(400).json({
                success: false,
                message: 'Name, Category, and Unit are required fields.'
            });
        }

        const [result] = await db.query(`
            INSERT INTO MEDICINE (Name, Category, Unit, Description)
            VALUES (?, ?, ?, ?)
        `, [Name, Category, Unit, Description || null]);

        res.status(201).json({
            success: true,
            message: 'Medicine added successfully.',
            data: {
                MedicineID: result.insertId,
                Name,
                Category,
                Unit,
                Description
            }
        });
    } catch (err) {
        next(err);
    }
}

module.exports = {
    getAllMedicines,
    getMedicineById,
    createMedicine
};
