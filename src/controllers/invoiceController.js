const db = require('../config/db');

/**
 * GET /api/invoices
 * List all invoices with customer details
 */
async function getAllInvoices(req, res, next) {
    try {
        const [rows] = await db.query(`
            SELECT 
                i.InvoiceID,
                i.InvoiceDate,
                i.TotalAmount,
                c.CustomerID,
                c.Name AS CustomerName,
                c.Phone AS CustomerPhone,
                COUNT(ii.ItemID) AS TotalItemsSold
            FROM INVOICE i
            JOIN CUSTOMER c ON i.CustomerID = c.CustomerID
            LEFT JOIN INVOICE_ITEM ii ON i.InvoiceID = ii.InvoiceID
            GROUP BY i.InvoiceID, i.InvoiceDate, i.TotalAmount, c.CustomerID, c.Name, c.Phone
            ORDER BY i.InvoiceID DESC
        `);

        res.json({ success: true, count: rows.length, data: rows });
    } catch (err) {
        next(err);
    }
}

/**
 * GET /api/invoices/:id
 * Query 4: Detailed Customer Invoice Breakdown
 */
async function getInvoiceById(req, res, next) {
    try {
        const { id } = req.params;

        // Fetch invoice header and customer
        const [invoices] = await db.query(`
            SELECT 
                i.InvoiceID,
                i.InvoiceDate,
                i.TotalAmount AS InvoiceGrandTotal,
                c.CustomerID,
                c.Name AS CustomerName,
                c.Phone AS CustomerPhone,
                c.Address AS CustomerAddress,
                c.City AS CustomerCity,
                c.Pincode AS CustomerPincode,
                c.Age AS CustomerAge,
                c.Gender AS CustomerGender,
                c.BloodGroup AS CustomerBloodGroup,
                c.Allergies AS CustomerAllergies
            FROM INVOICE i
            JOIN CUSTOMER c ON i.CustomerID = c.CustomerID
            WHERE i.InvoiceID = ?
        `, [id]);

        if (invoices.length === 0) {
            return res.status(404).json({ success: false, message: 'Invoice not found.' });
        }

        // Fetch line items
        const [items] = await db.query(`
            SELECT 
                ii.ItemID,
                b.BatchID,
                b.BatchNo,
                b.ExpiryDate,
                m.Name AS MedicineName,
                m.Category,
                m.Unit,
                ii.Quantity,
                ii.UnitPrice,
                ii.Discount,
                ((ii.Quantity * ii.UnitPrice) - ii.Discount) AS LineTotal
            FROM INVOICE_ITEM ii
            JOIN BATCH b ON ii.BatchID = b.BatchID
            JOIN MEDICINE m ON b.MedicineID = m.MedicineID
            WHERE ii.InvoiceID = ?
        `, [id]);

        res.json({
            success: true,
            data: {
                ...invoices[0],
                items
            }
        });
    } catch (err) {
        next(err);
    }
}

/**
 * POST /api/invoices
 * Creates an invoice and its items in an ACID transaction
 * Relies on MySQL Triggers:
 * - trg_before_invoice_item_insert: blocks sale if batch is expired or insufficient stock
 * - trg_after_invoice_item_insert: auto-deducts batch stock & calculates TotalAmount
 */
async function createInvoice(req, res, next) {
    const connection = await db.getConnection();
    try {
        const { CustomerID, items } = req.body;

        if (!CustomerID || !Array.isArray(items) || items.length === 0) {
            connection.release();
            return res.status(400).json({
                success: false,
                message: 'CustomerID and at least one item (BatchID, Quantity, UnitPrice) are required.'
            });
        }

        // Validate items payload
        for (const item of items) {
            if (!item.BatchID || !item.Quantity || item.UnitPrice == null || item.Quantity <= 0) {
                connection.release();
                return res.status(400).json({
                    success: false,
                    message: 'Each item must have a valid BatchID, Quantity > 0, and UnitPrice.'
                });
            }
        }

        // Begin Transaction
        await connection.beginTransaction();

        // 1. Insert Master INVOICE record (TotalAmount defaults to 0.00 and will be derived by trigger)
        const [invoiceResult] = await connection.query(`
            INSERT INTO INVOICE (CustomerID, InvoiceDate)
            VALUES (?, CURRENT_DATE)
        `, [CustomerID]);

        const invoiceId = invoiceResult.insertId;

        // 2. Insert line items one by one
        // If trg_before_invoice_item_insert fires an error (e.g. expired or out of stock),
        // execution jumps to the catch block and rolls back the transaction.
        for (const item of items) {
            const discount = item.Discount || 0.00;
            await connection.query(`
                INSERT INTO INVOICE_ITEM (InvoiceID, BatchID, Quantity, UnitPrice, Discount)
                VALUES (?, ?, ?, ?, ?)
            `, [invoiceId, item.BatchID, item.Quantity, item.UnitPrice, discount]);
        }

        // 3. Retrieve final derived TotalAmount calculated by the after-insert trigger
        const [finalInvoice] = await connection.query(`
            SELECT InvoiceID, InvoiceDate, TotalAmount FROM INVOICE WHERE InvoiceID = ?
        `, [invoiceId]);

        await connection.commit();
        connection.release();

        res.status(201).json({
            success: true,
            message: 'Invoice created successfully and stock deducted in real-time.',
            data: finalInvoice[0]
        });

    } catch (err) {
        await connection.rollback();
        connection.release();
        next(err);
    }
}

module.exports = {
    getAllInvoices,
    getInvoiceById,
    createInvoice
};
