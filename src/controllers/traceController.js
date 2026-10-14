const db = require('../config/db');

/**
 * GET /api/trace/batch/:batchNo
 * Query 3: Batch Traceability / Recall Audit Trail
 * If a manufacturer recalls a specific batch, identify which customers purchased it
 */
async function traceBatch(req, res, next) {
    try {
        const { batchNo } = req.params;

        // First check batch existence
        const [batchInfo] = await db.query(`
            SELECT 
                b.BatchID,
                b.BatchNo,
                b.MfgDate,
                b.ExpiryDate,
                b.QtyInHand AS RemainingStockInStore,
                m.Name AS MedicineName,
                m.Category,
                s.Name AS SupplierName,
                s.Phone AS SupplierPhone
            FROM BATCH b
            JOIN MEDICINE m ON b.MedicineID = m.MedicineID
            JOIN SUPPLIER s ON b.SupplierID = s.SupplierID
            WHERE b.BatchNo = ?
        `, [batchNo]);

        if (batchInfo.length === 0) {
            return res.status(404).json({
                success: false,
                message: `Batch "${batchNo}" not found in system.`
            });
        }

        // Trace all customers who purchased units from this batch
        const [customerSales] = await db.query(`
            SELECT 
                c.CustomerID,
                c.Name AS CustomerName,
                c.Phone AS CustomerPhone,
                c.Address AS CustomerAddress,
                i.InvoiceID,
                i.InvoiceDate,
                ii.Quantity AS QuantityPurchased,
                ii.UnitPrice,
                ((ii.Quantity * ii.UnitPrice) - ii.Discount) AS LineTotal
            FROM INVOICE_ITEM ii
            JOIN BATCH b ON ii.BatchID = b.BatchID
            JOIN INVOICE i ON ii.InvoiceID = i.InvoiceID
            JOIN CUSTOMER c ON i.CustomerID = c.CustomerID
            WHERE b.BatchNo = ?
            ORDER BY i.InvoiceDate DESC
        `, [batchNo]);

        const totalUnitsSold = customerSales.reduce((sum, sale) => sum + sale.QuantityPurchased, 0);

        res.json({
            success: true,
            data: {
                batch: batchInfo[0],
                totalUnitsSold,
                totalImpactedCustomers: customerSales.length,
                affectedSales: customerSales
            }
        });
    } catch (err) {
        next(err);
    }
}

module.exports = {
    traceBatch
};
