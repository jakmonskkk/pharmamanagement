const db = require('../config/db');

/**
 * GET /api/batches
 * List batches with medicine and supplier details, optional query filters
 */
async function getAllBatches(req, res, next) {
    try {
        const { medicineId, supplierId, inStock } = req.query;
        let sql = `
            SELECT 
                b.BatchID,
                b.BatchNo,
                b.MfgDate,
                b.ExpiryDate,
                DATEDIFF(b.ExpiryDate, CURRENT_DATE) AS DaysUntilExpiry,
                b.CostPrice,
                b.QtyInHand,
                m.MedicineID,
                m.Name AS MedicineName,
                m.Category,
                m.Unit,
                s.SupplierID,
                s.Name AS SupplierName,
                s.Phone AS SupplierPhone
            FROM BATCH b
            JOIN MEDICINE m ON b.MedicineID = m.MedicineID
            JOIN SUPPLIER s ON b.SupplierID = s.SupplierID
            WHERE 1=1
        `;
        const params = [];

        if (medicineId) {
            sql += ' AND b.MedicineID = ?';
            params.push(medicineId);
        }
        if (supplierId) {
            sql += ' AND b.SupplierID = ?';
            params.push(supplierId);
        }
        if (inStock === 'true') {
            sql += ' AND b.QtyInHand > 0';
        }

        sql += ' ORDER BY b.ExpiryDate ASC';

        const [rows] = await db.query(sql, params);
        res.json({ success: true, count: rows.length, data: rows });
    } catch (err) {
        next(err);
    }
}

/**
 * GET /api/batches/near-expiry
 * Query 1: Near-Expiry Batches Alert (Next 30 or customizable days)
 */
async function getNearExpiryBatches(req, res, next) {
    try {
        const days = parseInt(req.query.days, 10) || 30;

        const [rows] = await db.query(`
            SELECT 
                b.BatchID,
                b.BatchNo,
                m.MedicineID,
                m.Name AS MedicineName,
                m.Category,
                b.ExpiryDate,
                DATEDIFF(b.ExpiryDate, CURRENT_DATE) AS DaysRemaining,
                b.QtyInHand,
                b.CostPrice,
                (b.QtyInHand * b.CostPrice) AS AtRiskValue,
                s.SupplierID,
                s.Name AS SupplierName,
                s.Phone AS SupplierPhone
            FROM BATCH b
            JOIN MEDICINE m ON b.MedicineID = m.MedicineID
            JOIN SUPPLIER s ON b.SupplierID = s.SupplierID
            WHERE b.ExpiryDate BETWEEN CURRENT_DATE AND DATE_ADD(CURRENT_DATE, INTERVAL ? DAY)
              AND b.QtyInHand > 0
            ORDER BY b.ExpiryDate ASC
        `, [days]);

        res.json({
            success: true,
            filterDays: days,
            count: rows.length,
            data: rows
        });
    } catch (err) {
        next(err);
    }
}

/**
 * GET /api/batches/expired
 * Query 2: Blocked / Already Expired Batches
 */
async function getExpiredBatches(req, res, next) {
    try {
        const [rows] = await db.query(`
            SELECT 
                b.BatchID,
                b.BatchNo,
                m.MedicineID,
                m.Name AS MedicineName,
                m.Category,
                b.ExpiryDate,
                DATEDIFF(CURRENT_DATE, b.ExpiryDate) AS DaysPastExpiry,
                b.QtyInHand,
                b.CostPrice,
                (b.QtyInHand * b.CostPrice) AS FinancialLoss,
                s.SupplierID,
                s.Name AS SupplierName,
                s.Phone AS SupplierPhone
            FROM BATCH b
            JOIN MEDICINE m ON b.MedicineID = m.MedicineID
            JOIN SUPPLIER s ON b.SupplierID = s.SupplierID
            WHERE b.ExpiryDate < CURRENT_DATE AND b.QtyInHand > 0
            ORDER BY b.ExpiryDate ASC
        `);

        res.json({
            success: true,
            count: rows.length,
            data: rows
        });
    } catch (err) {
        next(err);
    }
}

/**
 * POST /api/batches
 * Receive new stock batch from a supplier
 */
async function createBatch(req, res, next) {
    try {
        const { BatchNo, MfgDate, ExpiryDate, CostPrice, QtyInHand, SupplierID, MedicineID } = req.body;

        if (!BatchNo || !MfgDate || !ExpiryDate || CostPrice == null || QtyInHand == null || !SupplierID || !MedicineID) {
            return res.status(400).json({
                success: false,
                message: 'All fields (BatchNo, MfgDate, ExpiryDate, CostPrice, QtyInHand, SupplierID, MedicineID) are required.'
            });
        }

        if (new Date(MfgDate) > new Date(ExpiryDate)) {
            return res.status(400).json({
                success: false,
                message: 'MfgDate cannot be greater than ExpiryDate.'
            });
        }

        const [result] = await db.query(`
            INSERT INTO BATCH (BatchNo, MfgDate, ExpiryDate, CostPrice, QtyInHand, SupplierID, MedicineID)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        `, [BatchNo, MfgDate, ExpiryDate, CostPrice, QtyInHand, SupplierID, MedicineID]);

        res.status(201).json({
            success: true,
            message: 'Batch received and recorded successfully.',
            data: {
                BatchID: result.insertId,
                BatchNo,
                QtyInHand,
                ExpiryDate
            }
        });
    } catch (err) {
        next(err);
    }
}

module.exports = {
    getAllBatches,
    getNearExpiryBatches,
    getExpiredBatches,
    createBatch
};
