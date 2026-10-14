const db = require('../config/db');

/**
 * GET /api/dashboard/summary
 * Returns high-level KPI metrics for the pharmacy dashboard
 */
async function getSummary(req, res, next) {
    try {
        const [medicineCount] = await db.query('SELECT COUNT(*) AS totalMedicines FROM MEDICINE');
        const [batchCount] = await db.query('SELECT COUNT(*) AS totalBatches FROM BATCH');
        
        const [nearExpiry] = await db.query(`
            SELECT COUNT(*) AS nearExpiryCount 
            FROM BATCH 
            WHERE ExpiryDate BETWEEN CURRENT_DATE AND DATE_ADD(CURRENT_DATE, INTERVAL 30 DAY)
              AND QtyInHand > 0
        `);

        const [expired] = await db.query(`
            SELECT COUNT(*) AS expiredCount, COALESCE(SUM(QtyInHand * CostPrice), 0) AS expiredLoss
            FROM BATCH 
            WHERE ExpiryDate < CURRENT_DATE AND QtyInHand > 0
        `);

        const [inventory] = await db.query(`
            SELECT 
                COALESCE(SUM(QtyInHand), 0) AS totalStockUnits,
                COALESCE(SUM(QtyInHand * CostPrice), 0) AS totalValuation
            FROM BATCH
        `);

        const [recentInvoices] = await db.query(`
            SELECT COUNT(*) AS totalInvoices, COALESCE(SUM(TotalAmount), 0) AS totalRevenue
            FROM INVOICE
        `);

        const isSalesperson = req.headers['x-user-role'] === 'salesperson';

        res.json({
            success: true,
            data: {
                totalMedicines: medicineCount[0].totalMedicines,
                totalBatches: batchCount[0].totalBatches,
                totalStockUnits: inventory[0].totalStockUnits,
                // Total financial valuation is strictly restricted from salesperson
                totalInventoryValuation: isSalesperson ? null : inventory[0].totalValuation,
                nearExpiryCount: nearExpiry[0].nearExpiryCount,
                expiredCount: expired[0].expiredCount,
                expiredLossAmount: isSalesperson ? null : expired[0].expiredLoss,
                totalInvoices: recentInvoices[0].totalInvoices,
                totalRevenue: isSalesperson ? null : recentInvoices[0].totalRevenue
            }
        });
    } catch (err) {
        next(err);
    }
}

/**
 * GET /api/dashboard/category-valuation
 * Query 5: Real-Time Inventory Stock & Total Valuation by Category
 */
async function getCategoryValuation(req, res, next) {
    try {
        if (req.headers['x-user-role'] === 'salesperson') {
            return res.status(403).json({
                success: false,
                error: 'Forbidden',
                message: 'Access Denied: Category inventory valuation is restricted to Administrators.'
            });
        }

        const [rows] = await db.query(`
            SELECT 
                m.Category,
                COUNT(DISTINCT m.MedicineID) AS MedicineCount,
                COALESCE(SUM(b.QtyInHand), 0) AS TotalStock,
                COALESCE(SUM(b.QtyInHand * b.CostPrice), 0) AS TotalValuation
            FROM MEDICINE m
            LEFT JOIN BATCH b ON m.MedicineID = b.MedicineID
            GROUP BY m.Category
            ORDER BY TotalValuation DESC
        `);

        res.json({ success: true, data: rows });
    } catch (err) {
        next(err);
    }
}

module.exports = {
    getSummary,
    getCategoryValuation
};
