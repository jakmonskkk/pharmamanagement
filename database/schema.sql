-- ========================================================
-- PharmaChain: Real-Time Pharmacy Inventory & Expiry Tracking Database
-- Relational Schema Definition (MySQL 8.0+)
-- ========================================================

DROP DATABASE IF EXISTS pharmachain_db;
CREATE DATABASE pharmachain_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE pharmachain_db;

-- --------------------------------------------------------
-- Table 1: SUPPLIER
-- --------------------------------------------------------
CREATE TABLE SUPPLIER (
    SupplierID INT AUTO_INCREMENT PRIMARY KEY,
    Name VARCHAR(100) NOT NULL,
    Phone VARCHAR(15) NOT NULL,
    Email VARCHAR(100) NOT NULL,
    Address VARCHAR(200) NOT NULL
) ENGINE=InnoDB;

-- --------------------------------------------------------
-- Table 2: MEDICINE
-- --------------------------------------------------------
CREATE TABLE MEDICINE (
    MedicineID INT AUTO_INCREMENT PRIMARY KEY,
    Name VARCHAR(100) NOT NULL,
    Category VARCHAR(50) NOT NULL,
    Unit VARCHAR(20) NOT NULL,
    Description VARCHAR(200)
) ENGINE=InnoDB;

-- --------------------------------------------------------
-- Table 3: BATCH
-- Tracks stock at the batch level (MfgDate, ExpiryDate, CostPrice, QtyInHand)
-- --------------------------------------------------------
CREATE TABLE BATCH (
    BatchID INT AUTO_INCREMENT PRIMARY KEY,
    BatchNo VARCHAR(50) NOT NULL,
    MfgDate DATE NOT NULL,
    ExpiryDate DATE NOT NULL,
    CostPrice DECIMAL(10,2) NOT NULL,
    QtyInHand INT NOT NULL DEFAULT 0,
    SupplierID INT NOT NULL,
    MedicineID INT NOT NULL,
    CONSTRAINT fk_batch_supplier FOREIGN KEY (SupplierID) 
        REFERENCES SUPPLIER(SupplierID) ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT fk_batch_medicine FOREIGN KEY (MedicineID) 
        REFERENCES MEDICINE(MedicineID) ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT chk_qty_in_hand CHECK (QtyInHand >= 0),
    CONSTRAINT chk_batch_dates CHECK (MfgDate <= ExpiryDate)
) ENGINE=InnoDB;

-- --------------------------------------------------------
-- Table 4: CUSTOMER
-- Complete patient and customer registry for prescription fulfillment
-- --------------------------------------------------------
CREATE TABLE CUSTOMER (
    CustomerID INT AUTO_INCREMENT PRIMARY KEY,
    Name VARCHAR(100) NOT NULL,
    Phone VARCHAR(15) NOT NULL,
    Email VARCHAR(100),
    Address VARCHAR(200) NOT NULL,
    City VARCHAR(100),
    Pincode VARCHAR(20),
    Age INT,
    Gender VARCHAR(20),
    BloodGroup VARCHAR(10),
    Allergies VARCHAR(255) DEFAULT 'None'
) ENGINE=InnoDB;

-- --------------------------------------------------------
-- Table 5: INVOICE
-- --------------------------------------------------------
CREATE TABLE INVOICE (
    InvoiceID INT AUTO_INCREMENT PRIMARY KEY,
    InvoiceDate DATE NOT NULL DEFAULT (CURRENT_DATE),
    TotalAmount DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    CustomerID INT NOT NULL,
    CONSTRAINT fk_invoice_customer FOREIGN KEY (CustomerID) 
        REFERENCES CUSTOMER(CustomerID) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB;

-- --------------------------------------------------------
-- Table 6: INVOICE_ITEM
-- Links invoice to exact batch sold
-- --------------------------------------------------------
CREATE TABLE INVOICE_ITEM (
    ItemID INT AUTO_INCREMENT PRIMARY KEY,
    InvoiceID INT NOT NULL,
    BatchID INT NOT NULL,
    Quantity INT NOT NULL,
    UnitPrice DECIMAL(10,2) NOT NULL,
    Discount DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    CONSTRAINT fk_item_invoice FOREIGN KEY (InvoiceID) 
        REFERENCES INVOICE(InvoiceID) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT fk_item_batch FOREIGN KEY (BatchID) 
        REFERENCES BATCH(BatchID) ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT chk_item_quantity CHECK (Quantity > 0),
    CONSTRAINT chk_item_price CHECK (UnitPrice >= 0),
    CONSTRAINT chk_item_discount CHECK (Discount >= 0)
) ENGINE=InnoDB;

-- --------------------------------------------------------
-- Table 7: APP_USER (Authentication & Role-Based Access)
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS APP_USER (
    UserID INT AUTO_INCREMENT PRIMARY KEY,
    Username VARCHAR(50) NOT NULL UNIQUE,
    PasswordHash VARCHAR(255) NOT NULL,
    FullName VARCHAR(100) NOT NULL,
    Role ENUM('admin', 'salesperson', 'customer') NOT NULL,
    Email VARCHAR(100),
    CustomerID INT NULL,
    CreatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_user_customer FOREIGN KEY (CustomerID)
        REFERENCES CUSTOMER(CustomerID) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB;

-- ========================================================
-- TRIGGERS FOR BUSINESS LOGIC ENFORCEMENT
-- ========================================================

-- Trigger 1: Guard against selling expired medicines or exceeding stock (FR4 & Section 5.3)
DELIMITER //
CREATE TRIGGER trg_before_invoice_item_insert
BEFORE INSERT ON INVOICE_ITEM
FOR EACH ROW
BEGIN
    DECLARE v_expiry DATE;
    DECLARE v_stock INT;
    
    SELECT ExpiryDate, QtyInHand INTO v_expiry, v_stock
    FROM BATCH
    WHERE BatchID = NEW.BatchID;
    
    -- Block sale if batch has expired
    IF v_expiry < CURRENT_DATE THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Sale Blocked: This medicine batch has already expired!';
    END IF;
    
    -- Block sale if not enough stock
    IF v_stock < NEW.Quantity THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Sale Blocked: Insufficient stock available in this batch!';
    END IF;
END //

-- Trigger 2: Real-time stock reduction and invoice total derivation (FR8 & FR10)
CREATE TRIGGER trg_after_invoice_item_insert
AFTER INSERT ON INVOICE_ITEM
FOR EACH ROW
BEGIN
    -- Deduct stock from the batch
    UPDATE BATCH
    SET QtyInHand = QtyInHand - NEW.Quantity
    WHERE BatchID = NEW.BatchID;
    
    -- Recalculate Invoice TotalAmount
    UPDATE INVOICE
    SET TotalAmount = (
        SELECT COALESCE(SUM((Quantity * UnitPrice) - Discount), 0.00)
        FROM INVOICE_ITEM
        WHERE InvoiceID = NEW.InvoiceID
    )
    WHERE InvoiceID = NEW.InvoiceID;
END //

-- Trigger 3: Stock restore & recalculate if an invoice item is deleted
CREATE TRIGGER trg_after_invoice_item_delete
AFTER DELETE ON INVOICE_ITEM
FOR EACH ROW
BEGIN
    -- Restore batch stock
    UPDATE BATCH
    SET QtyInHand = QtyInHand + OLD.Quantity
    WHERE BatchID = OLD.BatchID;
    
    -- Recalculate Invoice TotalAmount
    UPDATE INVOICE
    SET TotalAmount = (
        SELECT COALESCE(SUM((Quantity * UnitPrice) - Discount), 0.00)
        FROM INVOICE_ITEM
        WHERE InvoiceID = OLD.InvoiceID
    )
    WHERE InvoiceID = OLD.InvoiceID;
END //
DELIMITER ;

-- ========================================================
-- USEFUL VIEWS FOR REVIEWS & FRONTEND
-- ========================================================

-- View 1: Near-Expiry Batches (Expiring within the next 60 days) (FR4)
CREATE OR REPLACE VIEW v_near_expiry_batches AS
SELECT 
    b.BatchID,
    b.BatchNo,
    m.Name AS MedicineName,
    m.Category,
    b.ExpiryDate,
    DATEDIFF(b.ExpiryDate, CURRENT_DATE) AS DaysUntilExpiry,
    b.QtyInHand,
    s.Name AS SupplierName,
    s.Phone AS SupplierPhone
FROM BATCH b
JOIN MEDICINE m ON b.MedicineID = m.MedicineID
JOIN SUPPLIER s ON b.SupplierID = s.SupplierID
WHERE b.ExpiryDate >= CURRENT_DATE 
  AND b.ExpiryDate <= DATE_ADD(CURRENT_DATE, INTERVAL 60 DAY)
  AND b.QtyInHand > 0
ORDER BY b.ExpiryDate ASC;

-- View 2: Expired Batches (FR4)
CREATE OR REPLACE VIEW v_expired_batches AS
SELECT 
    b.BatchID,
    b.BatchNo,
    m.Name AS MedicineName,
    m.Category,
    b.ExpiryDate,
    DATEDIFF(CURRENT_DATE, b.ExpiryDate) AS DaysOverdue,
    b.QtyInHand,
    s.Name AS SupplierName
FROM BATCH b
JOIN MEDICINE m ON b.MedicineID = m.MedicineID
JOIN SUPPLIER s ON b.SupplierID = s.SupplierID
WHERE b.ExpiryDate < CURRENT_DATE AND b.QtyInHand > 0
ORDER BY b.ExpiryDate ASC;

-- View 3: Complete Inventory Status
CREATE OR REPLACE VIEW v_inventory_status AS
SELECT 
    m.MedicineID,
    m.Name AS MedicineName,
    m.Category,
    m.Unit,
    COUNT(b.BatchID) AS TotalBatches,
    COALESCE(SUM(b.QtyInHand), 0) AS TotalStockInHand
FROM MEDICINE m
LEFT JOIN BATCH b ON m.MedicineID = b.MedicineID
GROUP BY m.MedicineID, m.Name, m.Category, m.Unit;
