-- ========================================================
-- PharmaChain: Essential Queries for Project Reviews & Viva
-- ========================================================

USE pharmachain_db;


-- Query 1: Near-Expiry Batches Alert (Next 30 Days) (Requirement FR4)
-- Essential for pharmacy staff to prioritize sales or return stock to supplier.

SELECT 
    b.BatchID,
    b.BatchNo,
    m.Name AS MedicineName,
    m.Category,
    b.ExpiryDate,
    DATEDIFF(b.ExpiryDate, CURRENT_DATE) AS DaysRemaining,
    b.QtyInHand,
    s.Name AS SupplierName,
    s.Phone AS SupplierPhone
FROM BATCH b
JOIN MEDICINE m ON b.MedicineID = m.MedicineID
JOIN SUPPLIER s ON b.SupplierID = s.SupplierID
WHERE b.ExpiryDate BETWEEN CURRENT_DATE AND DATE_ADD(CURRENT_DATE, INTERVAL 30 DAY)
  AND b.QtyInHand > 0
ORDER BY b.ExpiryDate ASC;


-- Query 2: Blocked / Already Expired Batches (Requirement FR4, Section 5.3)
-- Must be segregated or discarded.

SELECT 
    b.BatchID,
    b.BatchNo,
    m.Name AS MedicineName,
    b.ExpiryDate,
    DATEDIFF(CURRENT_DATE, b.ExpiryDate) AS DaysPastExpiry,
    b.QtyInHand,
    (b.QtyInHand * b.CostPrice) AS FinancialLoss,
    s.Name AS SupplierName
FROM BATCH b
JOIN MEDICINE m ON b.MedicineID = m.MedicineID
JOIN SUPPLIER s ON b.SupplierID = s.SupplierID
WHERE b.ExpiryDate < CURRENT_DATE AND b.QtyInHand > 0;


-- Query 3: Batch Traceability / Recall Trace (Non-Functional Requirement: Auditability)
-- If a manufacturer recalls a specific batch, identify which customers purchased it!

SELECT 
    b.BatchNo,
    m.Name AS MedicineName,
    s.Name AS SupplierName,
    c.Name AS CustomerName,
    c.Phone AS CustomerPhone,
    i.InvoiceID,
    i.InvoiceDate,
    ii.Quantity AS QuantitySold
FROM INVOICE_ITEM ii
JOIN BATCH b ON ii.BatchID = b.BatchID
JOIN MEDICINE m ON b.MedicineID = m.MedicineID
JOIN SUPPLIER s ON b.SupplierID = s.SupplierID
JOIN INVOICE i ON ii.InvoiceID = i.InvoiceID
JOIN CUSTOMER c ON i.CustomerID = c.CustomerID
WHERE b.BatchNo = 'BATCH-PAR-26A';


-- Query 4: Detailed Customer Invoice Breakdown (Requirement FR6, FR7, FR10)

SELECT 
    i.InvoiceID,
    i.InvoiceDate,
    c.Name AS CustomerName,
    c.Phone AS CustomerPhone,
    m.Name AS MedicineName,
    b.BatchNo,
    b.ExpiryDate,
    ii.Quantity,
    ii.UnitPrice,
    ii.Discount,
    ((ii.Quantity * ii.UnitPrice) - ii.Discount) AS LineTotal,
    i.TotalAmount AS InvoiceGrandTotal
FROM INVOICE i
JOIN CUSTOMER c ON i.CustomerID = c.CustomerID
JOIN INVOICE_ITEM ii ON i.InvoiceID = ii.InvoiceID
JOIN BATCH b ON ii.BatchID = b.BatchID
JOIN MEDICINE m ON b.MedicineID = m.MedicineID
WHERE i.InvoiceID = 1;

-- Query 5: Real-Time Inventory Stock & Total Valuation (Requirement FR9)

SELECT 
    m.Category,
    m.Name AS MedicineName,
    m.Unit,
    SUM(b.QtyInHand) AS TotalStock,
    SUM(b.QtyInHand * b.CostPrice) AS TotalValuation
FROM MEDICINE m
JOIN BATCH b ON m.MedicineID = b.MedicineID
GROUP BY m.Category, m.Name, m.Unit
ORDER BY TotalValuation DESC;


