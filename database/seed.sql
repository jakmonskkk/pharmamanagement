-- ========================================================
-- PharmaChain: Extended Seed Data (50+ Batches, Realistic Data)
-- ========================================================

USE pharmachain_db;

-- Safely clear existing test records and reset auto-increments
SET FOREIGN_KEY_CHECKS = 0;
TRUNCATE TABLE INVOICE_ITEM;
TRUNCATE TABLE INVOICE;
TRUNCATE TABLE BATCH;
TRUNCATE TABLE MEDICINE;
TRUNCATE TABLE CUSTOMER;
TRUNCATE TABLE SUPPLIER;
SET FOREIGN_KEY_CHECKS = 1;

-- --------------------------------------------------------
-- 1. Insert 10 Suppliers
-- --------------------------------------------------------
INSERT INTO SUPPLIER (SupplierID, Name, Phone, Email, Address) VALUES
(1, 'Sun Pharma Distributors', '+91 9876543210', 'orders@sunpharma.example.com', 'Plot 42, MIDC Industrial Area, Mumbai'),
(2, 'Cipla Logistics Hub', '+91 9822334455', 'supply@cipla.example.com', 'Sector 18, Udyog Vihar, Gurugram'),
(3, 'Dr. Reddy\'s MedSupply', '+91 9445566778', 'contact@drreddys.example.com', 'Banjara Hills, Road No. 3, Hyderabad'),
(4, 'Abbott Healthcare Depot', '+91 9112233445', 'depot@abbott.example.com', 'Peenya Industrial Estate, Bengaluru'),
(5, 'Torrent Lifesciences', '+91 9988776655', 'support@torrent.example.com', 'Sanand Industrial Estate, Ahmedabad'),
(6, 'Lupin Pharmaceuticals Depot', '+91 9833445566', 'orders@lupin.example.com', 'Kalpataru Inspire, Santacruz, Mumbai'),
(7, 'Zydus Lifesciences Hub', '+91 9722334411', 'distribution@zydus.example.com', 'Zydus Corporate Park, Ahmedabad'),
(8, 'Glenmark Pharma Supply', '+91 9819283746', 'logistics@glenmark.example.com', 'Glenmark House, Andheri East, Mumbai'),
(9, 'Mankind Pharma Network', '+91 9910293847', 'trade@mankind.example.com', 'Okhla Industrial Area, New Delhi'),
(10, 'Alkem Laboratories Depot', '+91 9820394857', 'supply@alkem.example.com', 'Senapati Bapat Marg, Lower Parel, Mumbai');

-- --------------------------------------------------------
-- 2. Insert 25 Medicines
-- --------------------------------------------------------
INSERT INTO MEDICINE (MedicineID, Name, Category, Unit, Description) VALUES
(1, 'Paracetamol 500mg', 'Antipyretic / Analgesic', 'Strip (10 tabs)', 'For fever and mild to moderate pain relief'),
(2, 'Amoxicillin 500mg', 'Antibiotic', 'Strip (10 caps)', 'Broad spectrum penicillin antibiotic'),
(3, 'Cetirizine 10mg', 'Antihistamine', 'Strip (10 tabs)', 'Anti-allergy medication for rhinitis and hives'),
(4, 'Azithromycin 500mg', 'Antibiotic', 'Strip (3 tabs)', 'Macrolide antibiotic for respiratory infections'),
(5, 'Metformin 500mg', 'Antidiabetic', 'Strip (15 tabs)', 'First-line medication for type 2 diabetes'),
(6, 'Atorvastatin 20mg', 'Cardiovascular', 'Strip (10 tabs)', 'Statin used to lower cholesterol and prevent CVD'),
(7, 'Omeprazole 20mg', 'Gastrointestinal', 'Strip (10 caps)', 'Proton pump inhibitor for acid reflux and ulcers'),
(8, 'Benadryl Cough Syrup', 'Respiratory', 'Bottle (100ml)', 'Relief for dry cough and throat irritation'),
(9, 'Ibuprofen 400mg', 'Analgesic / Anti-inflammatory', 'Strip (10 tabs)', 'NSAID for pain, headache, and dental ache'),
(10, 'Pantoprazole 40mg', 'Gastrointestinal', 'Strip (10 tabs)', 'Acid reducer for heartburn and GERD'),
(11, 'Amlodipine 5mg', 'Cardiovascular', 'Strip (10 tabs)', 'Calcium channel blocker for hypertension'),
(12, 'Telmisartan 40mg', 'Cardiovascular', 'Strip (10 tabs)', 'Angiotensin receptor blocker for blood pressure control'),
(13, 'Montelukast 10mg', 'Respiratory', 'Strip (10 tabs)', 'Leukotriene receptor antagonist for asthma and allergies'),
(14, 'Ciprofloxacin 500mg', 'Antibiotic', 'Strip (10 tabs)', 'Fluoroquinolone antibiotic for bacterial infections'),
(15, 'Dolo 650mg', 'Antipyretic / Analgesic', 'Strip (15 tabs)', 'Paracetamol 650mg for high fever and body ache'),
(16, 'Losartan 50mg', 'Cardiovascular', 'Strip (10 tabs)', 'Anti-hypertensive medicine for cardiac protection'),
(17, 'Rosuvastatin 10mg', 'Cardiovascular', 'Strip (10 tabs)', 'Lipid-lowering drug for managing high triglycerides'),
(18, 'Glimepiride 2mg', 'Antidiabetic', 'Strip (10 tabs)', 'Sulfonylurea for glycemic control in diabetes'),
(19, 'Vitamin C 500mg Chewable', 'Nutritional Supplement', 'Strip (15 tabs)', 'Immunity booster and antioxidant chewables'),
(20, 'Vitamin D3 60000 IU', 'Nutritional Supplement', 'Strip (4 caps)', 'High-potency cholecalciferol for bone strength'),
(21, 'Zincovit Multivitamin', 'Nutritional Supplement', 'Strip (15 tabs)', 'Multivitamin and multimineral daily wellness supplement'),
(22, 'Levocetirizine 5mg', 'Antihistamine', 'Strip (10 tabs)', 'Fast acting non-drowsy anti-allergic tablet'),
(23, 'Ranitidine 150mg', 'Gastrointestinal', 'Strip (10 tabs)', 'H2 blocker for mild acid indigestion'),
(24, 'Clopidogrel 75mg', 'Cardiovascular', 'Strip (10 tabs)', 'Antiplatelet agent to prevent blood clots'),
(25, 'ORS Oral Rehydration Salts', 'Electrolytes', 'Sachet (21.8g)', 'WHO recommended formula for dehydration relief');

-- --------------------------------------------------------
-- 3. Insert 50 Batches (Active, Near-Expiry, and Expired)
-- --------------------------------------------------------
INSERT INTO BATCH (BatchID, BatchNo, MfgDate, ExpiryDate, CostPrice, QtyInHand, SupplierID, MedicineID) VALUES
-- Batch 1 - 10: General stock (Long shelf life: 1-2 years ahead)
(1, 'BATCH-PAR-26A', DATE_SUB(CURRENT_DATE, INTERVAL 90 DAY), DATE_ADD(CURRENT_DATE, INTERVAL 450 DAY), 15.00, 250, 1, 1),
(2, 'BATCH-PAR-26B', DATE_SUB(CURRENT_DATE, INTERVAL 45 DAY), DATE_ADD(CURRENT_DATE, INTERVAL 550 DAY), 15.50, 300, 2, 1),
(3, 'BATCH-AMX-26A', DATE_SUB(CURRENT_DATE, INTERVAL 60 DAY), DATE_ADD(CURRENT_DATE, INTERVAL 365 DAY), 62.00, 120, 2, 2),
(4, 'BATCH-AMX-26B', DATE_SUB(CURRENT_DATE, INTERVAL 30 DAY), DATE_ADD(CURRENT_DATE, INTERVAL 400 DAY), 64.00, 150, 6, 2),
(5, 'BATCH-CET-26A', DATE_SUB(CURRENT_DATE, INTERVAL 120 DAY), DATE_ADD(CURRENT_DATE, INTERVAL 300 DAY), 18.00, 180, 3, 3),
(6, 'BATCH-AZI-26A', DATE_SUB(CURRENT_DATE, INTERVAL 45 DAY), DATE_ADD(CURRENT_DATE, INTERVAL 420 DAY), 75.00, 140, 1, 4),
(7, 'BATCH-AZI-26B', DATE_SUB(CURRENT_DATE, INTERVAL 20 DAY), DATE_ADD(CURRENT_DATE, INTERVAL 500 DAY), 78.00, 200, 8, 4),
(8, 'BATCH-MET-26A', DATE_SUB(CURRENT_DATE, INTERVAL 100 DAY), DATE_ADD(CURRENT_DATE, INTERVAL 480 DAY), 28.00, 400, 4, 5),
(9, 'BATCH-MET-26B', DATE_SUB(CURRENT_DATE, INTERVAL 50 DAY), DATE_ADD(CURRENT_DATE, INTERVAL 520 DAY), 29.50, 350, 7, 5),
(10, 'BATCH-ATV-26A', DATE_SUB(CURRENT_DATE, INTERVAL 80 DAY), DATE_ADD(CURRENT_DATE, INTERVAL 380 DAY), 82.00, 160, 5, 6),

-- Batch 11 - 20: General stock (Long shelf life continued)
(11, 'BATCH-OMP-26A', DATE_SUB(CURRENT_DATE, INTERVAL 75 DAY), DATE_ADD(CURRENT_DATE, INTERVAL 340 DAY), 34.00, 220, 3, 7),
(12, 'BATCH-CSY-26A', DATE_SUB(CURRENT_DATE, INTERVAL 60 DAY), DATE_ADD(CURRENT_DATE, INTERVAL 280 DAY), 58.00, 95, 4, 8),
(13, 'BATCH-IBU-26A', DATE_SUB(CURRENT_DATE, INTERVAL 90 DAY), DATE_ADD(CURRENT_DATE, INTERVAL 600 DAY), 22.00, 280, 9, 9),
(14, 'BATCH-IBU-26B', DATE_SUB(CURRENT_DATE, INTERVAL 40 DAY), DATE_ADD(CURRENT_DATE, INTERVAL 650 DAY), 23.00, 310, 1, 9),
(15, 'BATCH-PAN-26A', DATE_SUB(CURRENT_DATE, INTERVAL 110 DAY), DATE_ADD(CURRENT_DATE, INTERVAL 420 DAY), 45.00, 190, 5, 10),
(16, 'BATCH-PAN-26B', DATE_SUB(CURRENT_DATE, INTERVAL 30 DAY), DATE_ADD(CURRENT_DATE, INTERVAL 490 DAY), 46.50, 250, 10, 10),
(17, 'BATCH-AML-26A', DATE_SUB(CURRENT_DATE, INTERVAL 140 DAY), DATE_ADD(CURRENT_DATE, INTERVAL 320 DAY), 24.00, 210, 2, 11),
(18, 'BATCH-TEL-26A', DATE_SUB(CURRENT_DATE, INTERVAL 85 DAY), DATE_ADD(CURRENT_DATE, INTERVAL 460 DAY), 55.00, 175, 7, 12),
(19, 'BATCH-MON-26A', DATE_SUB(CURRENT_DATE, INTERVAL 95 DAY), DATE_ADD(CURRENT_DATE, INTERVAL 390 DAY), 68.00, 130, 8, 13),
(20, 'BATCH-CIP-26A', DATE_SUB(CURRENT_DATE, INTERVAL 50 DAY), DATE_ADD(CURRENT_DATE, INTERVAL 360 DAY), 42.00, 160, 2, 14),

-- Batch 21 - 30: General stock (Long shelf life continued)
(21, 'BATCH-DOL-26A', DATE_SUB(CURRENT_DATE, INTERVAL 40 DAY), DATE_ADD(CURRENT_DATE, INTERVAL 620 DAY), 26.00, 500, 9, 15),
(22, 'BATCH-DOL-26B', DATE_SUB(CURRENT_DATE, INTERVAL 15 DAY), DATE_ADD(CURRENT_DATE, INTERVAL 700 DAY), 26.50, 600, 1, 15),
(23, 'BATCH-LOS-26A', DATE_SUB(CURRENT_DATE, INTERVAL 130 DAY), DATE_ADD(CURRENT_DATE, INTERVAL 310 DAY), 48.00, 140, 5, 16),
(24, 'BATCH-ROS-26A', DATE_SUB(CURRENT_DATE, INTERVAL 70 DAY), DATE_ADD(CURRENT_DATE, INTERVAL 450 DAY), 92.00, 110, 7, 17),
(25, 'BATCH-GLI-26A', DATE_SUB(CURRENT_DATE, INTERVAL 105 DAY), DATE_ADD(CURRENT_DATE, INTERVAL 380 DAY), 38.00, 190, 6, 18),
(26, 'BATCH-VTC-26A', DATE_SUB(CURRENT_DATE, INTERVAL 65 DAY), DATE_ADD(CURRENT_DATE, INTERVAL 420 DAY), 32.00, 320, 4, 19),
(27, 'BATCH-VTD-26A', DATE_SUB(CURRENT_DATE, INTERVAL 80 DAY), DATE_ADD(CURRENT_DATE, INTERVAL 500 DAY), 110.00, 150, 3, 20),
(28, 'BATCH-ZNC-26A', DATE_SUB(CURRENT_DATE, INTERVAL 90 DAY), DATE_ADD(CURRENT_DATE, INTERVAL 480 DAY), 72.00, 220, 10, 21),
(29, 'BATCH-LEV-26A', DATE_SUB(CURRENT_DATE, INTERVAL 55 DAY), DATE_ADD(CURRENT_DATE, INTERVAL 400 DAY), 35.00, 180, 8, 22),
(30, 'BATCH-RAN-26A', DATE_SUB(CURRENT_DATE, INTERVAL 100 DAY), DATE_ADD(CURRENT_DATE, INTERVAL 330 DAY), 16.00, 240, 2, 23),
(31, 'BATCH-CLP-26A', DATE_SUB(CURRENT_DATE, INTERVAL 85 DAY), DATE_ADD(CURRENT_DATE, INTERVAL 440 DAY), 88.00, 125, 5, 24),
(32, 'BATCH-ORS-26A', DATE_SUB(CURRENT_DATE, INTERVAL 60 DAY), DATE_ADD(CURRENT_DATE, INTERVAL 600 DAY), 14.00, 450, 4, 25),

-- Batch 33 - 42: Near-Expiry Batches (Expiring in 5 to 55 days - triggers near-expiry alerts!)
(33, 'BATCH-ATV-EXP08', DATE_SUB(CURRENT_DATE, INTERVAL 355 DAY), DATE_ADD(CURRENT_DATE, INTERVAL 8 DAY), 85.00, 22, 5, 6),
(34, 'BATCH-OMP-EXP14', DATE_SUB(CURRENT_DATE, INTERVAL 340 DAY), DATE_ADD(CURRENT_DATE, INTERVAL 14 DAY), 32.00, 35, 3, 7),
(35, 'BATCH-CSY-EXP21', DATE_SUB(CURRENT_DATE, INTERVAL 320 DAY), DATE_ADD(CURRENT_DATE, INTERVAL 21 DAY), 60.00, 18, 4, 8),
(36, 'BATCH-AMX-EXP28', DATE_SUB(CURRENT_DATE, INTERVAL 335 DAY), DATE_ADD(CURRENT_DATE, INTERVAL 28 DAY), 61.00, 40, 2, 2),
(37, 'BATCH-CET-EXP32', DATE_SUB(CURRENT_DATE, INTERVAL 330 DAY), DATE_ADD(CURRENT_DATE, INTERVAL 32 DAY), 17.50, 50, 3, 3),
(38, 'BATCH-MET-EXP40', DATE_SUB(CURRENT_DATE, INTERVAL 325 DAY), DATE_ADD(CURRENT_DATE, INTERVAL 40 DAY), 27.00, 65, 7, 5),
(39, 'BATCH-PAN-EXP45', DATE_SUB(CURRENT_DATE, INTERVAL 320 DAY), DATE_ADD(CURRENT_DATE, INTERVAL 45 DAY), 44.00, 30, 10, 10),
(40, 'BATCH-CIP-EXP50', DATE_SUB(CURRENT_DATE, INTERVAL 310 DAY), DATE_ADD(CURRENT_DATE, INTERVAL 50 DAY), 40.00, 25, 2, 14),
(41, 'BATCH-DOL-EXP55', DATE_SUB(CURRENT_DATE, INTERVAL 305 DAY), DATE_ADD(CURRENT_DATE, INTERVAL 55 DAY), 25.00, 80, 9, 15),
(42, 'BATCH-MON-EXP58', DATE_SUB(CURRENT_DATE, INTERVAL 300 DAY), DATE_ADD(CURRENT_DATE, INTERVAL 58 DAY), 66.00, 35, 8, 13),

-- Batch 43 - 50: Expired Batches (Past expiry date - automatically blocked by DB trigger trg_before_invoice_item_insert)
(43, 'BATCH-PAR-OLD01', DATE_SUB(CURRENT_DATE, INTERVAL 400 DAY), DATE_SUB(CURRENT_DATE, INTERVAL 10 DAY), 14.00, 45, 1, 1),
(44, 'BATCH-AZI-OLD02', DATE_SUB(CURRENT_DATE, INTERVAL 450 DAY), DATE_SUB(CURRENT_DATE, INTERVAL 25 DAY), 70.00, 20, 8, 4),
(45, 'BATCH-AML-OLD03', DATE_SUB(CURRENT_DATE, INTERVAL 500 DAY), DATE_SUB(CURRENT_DATE, INTERVAL 40 DAY), 22.00, 60, 2, 11),
(46, 'BATCH-TEL-OLD04', DATE_SUB(CURRENT_DATE, INTERVAL 520 DAY), DATE_SUB(CURRENT_DATE, INTERVAL 60 DAY), 52.00, 15, 7, 12),
(47, 'BATCH-VTD-OLD05', DATE_SUB(CURRENT_DATE, INTERVAL 550 DAY), DATE_SUB(CURRENT_DATE, INTERVAL 90 DAY), 105.00, 12, 3, 20),
(48, 'BATCH-RAN-OLD06', DATE_SUB(CURRENT_DATE, INTERVAL 600 DAY), DATE_SUB(CURRENT_DATE, INTERVAL 120 DAY), 15.00, 50, 2, 23),
(49, 'BATCH-IBU-OLD07', DATE_SUB(CURRENT_DATE, INTERVAL 480 DAY), DATE_SUB(CURRENT_DATE, INTERVAL 15 DAY), 21.00, 30, 9, 9),
(50, 'BATCH-ORS-OLD08', DATE_SUB(CURRENT_DATE, INTERVAL 750 DAY), DATE_SUB(CURRENT_DATE, INTERVAL 180 DAY), 12.00, 75, 4, 25);

-- --------------------------------------------------------
-- 4. Insert 20 Customers
-- --------------------------------------------------------
INSERT INTO CUSTOMER (CustomerID, Name, Phone, Address) VALUES
(1, 'Rahul Sharma', '+91 9811223344', 'Flat 302, Green Acres, Viman Nagar, Pune'),
(2, 'Priya Patel', '+91 9723456789', 'House 14, Shanti Niketan, Ahmedabad'),
(3, 'Amit Verma', '+91 9845123456', 'Plot 5B, Whitefield Main Road, Bengaluru'),
(4, 'Sneha Iyer', '+91 9962345678', '12/4 South End Road, Basavanagudi, Bengaluru'),
(5, 'Vikram Malhotra', '+91 9820123456', 'Tower 3, Hiranandani Gardens, Powai, Mumbai'),
(6, 'Ananya Sengupta', '+91 9831098765', 'Salt Lake City, Sector V, Kolkata'),
(7, 'Karan Singhania', '+91 9810112233', 'C-48, Greater Kailash I, New Delhi'),
(8, 'Deepika Nair', '+91 9447012345', 'Panampilly Nagar, Kochi, Kerala'),
(9, 'Manoj Joshi', '+91 9829034567', 'Civil Lines, Jaipur, Rajasthan'),
(10, 'Sunita Deshmukh', '+91 9890123450', 'Model Colony, Shivaji Nagar, Pune'),
(11, 'Rajesh Kulkarni', '+91 9422034512', 'Kothrud, Paud Road, Pune'),
(12, 'Kavita Menon', '+91 9846056789', 'Kaloor Kadavanthra Road, Kochi'),
(13, 'Arjun Reddy', '+91 9885067890', 'Jubilee Hills, Road 36, Hyderabad'),
(14, 'Pooja Agarwal', '+91 9331045678', 'Alipore Road, Kolkata'),
(15, 'Suresh Choudhary', '+91 9414078901', 'Vaishali Nagar, Jaipur'),
(16, 'Neha Bhatt', '+91 9879012345', 'Navrangpura, Ahmedabad'),
(17, 'Rohan Mehra', '+91 9818023456', 'Sushant Lok Phase 1, Gurugram'),
(18, 'Meenakshi Sundaram', '+91 9444089012', 'T. Nagar, Usman Road, Chennai'),
(19, 'Gaurav Bansal', '+91 9814034567', 'Sector 17, Chandigarh'),
(20, 'Divya Pillai', '+91 9847098765', 'Kowdiar, Thiruvananthapuram');

-- --------------------------------------------------------
-- 5. Insert 15 Invoices
-- --------------------------------------------------------
INSERT INTO INVOICE (InvoiceID, InvoiceDate, CustomerID) VALUES
(1, DATE_SUB(CURRENT_DATE, INTERVAL 7 DAY), 1),
(2, DATE_SUB(CURRENT_DATE, INTERVAL 6 DAY), 2),
(3, DATE_SUB(CURRENT_DATE, INTERVAL 5 DAY), 3),
(4, DATE_SUB(CURRENT_DATE, INTERVAL 5 DAY), 4),
(5, DATE_SUB(CURRENT_DATE, INTERVAL 4 DAY), 5),
(6, DATE_SUB(CURRENT_DATE, INTERVAL 4 DAY), 6),
(7, DATE_SUB(CURRENT_DATE, INTERVAL 3 DAY), 7),
(8, DATE_SUB(CURRENT_DATE, INTERVAL 3 DAY), 8),
(9, DATE_SUB(CURRENT_DATE, INTERVAL 2 DAY), 9),
(10, DATE_SUB(CURRENT_DATE, INTERVAL 2 DAY), 10),
(11, DATE_SUB(CURRENT_DATE, INTERVAL 1 DAY), 11),
(12, DATE_SUB(CURRENT_DATE, INTERVAL 1 DAY), 12),
(13, CURRENT_DATE, 13),
(14, CURRENT_DATE, 14),
(15, CURRENT_DATE, 15);

-- --------------------------------------------------------
-- 6. Insert 35 Invoice Line Items
-- (Stock deduction and invoice totals are automatically managed by DB triggers)
-- --------------------------------------------------------
INSERT INTO INVOICE_ITEM (InvoiceID, BatchID, Quantity, UnitPrice, Discount) VALUES
-- Invoice 1 items
(1, 1, 2, 25.00, 0.00),    -- Paracetamol (Batch 1)
(1, 5, 1, 30.00, 5.00),    -- Cetirizine (Batch 5)

-- Invoice 2 items
(2, 3, 3, 95.00, 10.00),   -- Amoxicillin (Batch 3)

-- Invoice 3 items
(3, 8, 2, 42.00, 0.00),    -- Metformin (Batch 8)
(3, 10, 1, 115.00, 5.00),  -- Atorvastatin (Batch 10)

-- Invoice 4 items
(4, 6, 1, 120.00, 10.00),  -- Azithromycin (Batch 6)
(4, 12, 1, 90.00, 0.00),   -- Benadryl (Batch 12)

-- Invoice 5 items
(5, 13, 2, 35.00, 0.00),   -- Ibuprofen (Batch 13)
(5, 15, 2, 68.00, 6.00),   -- Pantoprazole (Batch 15)

-- Invoice 6 items
(6, 17, 3, 38.00, 4.00),   -- Amlodipine (Batch 17)
(6, 21, 2, 40.00, 0.00),   -- Dolo 650 (Batch 21)

-- Invoice 7 items
(7, 23, 1, 75.00, 5.00),   -- Losartan (Batch 23)
(7, 24, 1, 140.00, 10.00), -- Rosuvastatin (Batch 24)
(7, 25, 2, 58.00, 0.00),   -- Glimepiride (Batch 25)

-- Invoice 8 items
(8, 26, 2, 50.00, 5.00),   -- Vitamin C (Batch 26)
(8, 27, 1, 160.00, 15.00), -- Vitamin D3 (Batch 27)

-- Invoice 9 items
(9, 28, 1, 110.00, 10.00), -- Zincovit (Batch 28)
(9, 29, 2, 52.00, 0.00),   -- Levocetirizine (Batch 29)

-- Invoice 10 items
(10, 18, 2, 85.00, 5.00),  -- Telmisartan (Batch 18)
(10, 31, 1, 130.00, 10.00),-- Clopidogrel (Batch 31)

-- Invoice 11 items
(11, 2, 3, 26.00, 0.00),   -- Paracetamol (Batch 2)
(11, 19, 1, 105.00, 5.00), -- Montelukast (Batch 19)

-- Invoice 12 items
(12, 20, 2, 65.00, 5.00),  -- Ciprofloxacin (Batch 20)
(12, 32, 5, 22.00, 0.00),  -- ORS (Batch 32)

-- Invoice 13 items
(13, 22, 4, 40.00, 0.00),  -- Dolo 650 (Batch 22)
(13, 11, 2, 55.00, 5.00),  -- Omeprazole (Batch 11)

-- Invoice 14 items
(14, 4, 2, 98.00, 8.00),   -- Amoxicillin (Batch 4)
(14, 7, 1, 125.00, 10.00), -- Azithromycin (Batch 7)
(14, 30, 2, 25.00, 0.00),  -- Ranitidine (Batch 30)

-- Invoice 15 items
(15, 14, 2, 36.00, 0.00),  -- Ibuprofen (Batch 14)
(15, 16, 2, 70.00, 5.00),  -- Pantoprazole (Batch 16)
(15, 26, 1, 50.00, 0.00);  -- Vitamin C (Batch 26)

-- --------------------------------------------------------
-- 7. Insert Default System Users & Roles
-- --------------------------------------------------------
INSERT INTO APP_USER (UserID, Username, PasswordHash, FullName, Role, Email, CustomerID) VALUES
(1, 'admin', 'admin123', 'Dr. Sarah Jenkins', 'admin', 'admin@pharmachain.internal', NULL),
(2, 'sales', 'sales123', 'Alex Rivera', 'salesperson', 'sales@pharmachain.internal', NULL),
(3, 'salesperson', 'salesperson123', 'Maria Santos', 'salesperson', 'maria.dispensing@pharmachain.internal', NULL),
(4, 'customer', 'customer123', 'Rahul Sharma', 'customer', 'rahul.sharma@example.com', 1),
(5, 'priya', 'priya123', 'Priya Patel', 'customer', 'priya.patel@example.com', 2)
ON DUPLICATE KEY UPDATE FullName = VALUES(FullName), Role = VALUES(Role);


