# PharmaChain REST API Backend

Production-ready REST API backend for the **PharmaChain: Real-Time Pharmacy Inventory & Expiry Tracking System**, built with **Node.js, Express, and MySQL2 (Connection Pooling & ACID Transactions)**.

---

## 🏗️ Architecture Overview

The backend is built using a clean, layered MVC pattern:

```
pharmachain/
├── database/
│   ├── schema.sql           # MySQL 8 schema with tables, triggers, and views
│   ├── seed.sql             # 50+ realistic batches, medicines, suppliers
│   └── queries.sql          # Essential queries for project evaluation & viva
├── src/
│   ├── config/
│   │   └── db.js            # MySQL2 connection pool (thread-safe, high concurrency)
│   ├── controllers/
│   │   ├── dashboardController.js # KPI cards & category valuation
│   │   ├── batchController.js     # Near-expiry alerts (Query 1) & expired stock (Query 2)
│   │   ├── medicineController.js  # Catalog & real-time stock levels
│   │   ├── invoiceController.js   # Transaction-safe billing with database triggers
│   │   ├── traceController.js     # Batch recall & customer audit trail (Query 3)
│   │   ├── customerController.js  # Customer registry
│   │   └── supplierController.js  # Supplier network management
│   ├── routes/                    # Modular Express routes
│   ├── middleware/
│   │   └── errorHandler.js  # Catches MySQL 45000 trigger exceptions & formats JSON
│   ├── public/
│   │   └── index.html       # Built-in Interactive Web API & Control Console
│   └── server.js            # Express app entry point
├── .env                     # Local environment configuration
├── package.json
└── README.md
```

---

## ⚡ Quick Start

### 1. Configure MySQL Password
Open [.env](file:///c:/Users/jacob/.gemini/antigravity-ide/scratch/pharmachain/.env) and set your local MySQL password:

```env
PORT=5000
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_mysql_password_here
DB_NAME=pharmachain_db
DB_PORT=3306
```

### 2. Import Database Schema & Seed Data
Run the following in your terminal to create the database, tables, triggers, and sample data:

```powershell
mysql -u root -p < database/schema.sql
mysql -u root -p < database/seed.sql
```

### 3. Start the Backend Server
```powershell
npm start
```
*(Or use `npm run dev` for auto-reloading during development).*

### 4. Open Interactive Control Console
Visit:
👉 **[http://localhost:5000](http://localhost:5000)**

You can view live KPI statistics and test every single endpoint directly from the browser with zero external tools required.

---

## 📡 API Endpoints Reference

### 1. Dashboard & Reports
| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/api/dashboard/summary` | Real-time KPI counts (medicines, batches, near-expiry, revenue) |
| `GET` | `/api/dashboard/category-valuation` | Category-wise stock totals and valuation (**Query 5**) |

### 2. Batches & Expiry Tracking
| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/api/batches` | All batches with stock & supplier details |
| `GET` | `/api/batches/near-expiry?days=30` | Alert batches expiring in next 30/60 days (**Query 1**) |
| `GET` | `/api/batches/expired` | Blocked & expired batches with calculated loss (**Query 2**) |
| `POST` | `/api/batches` | Receive and record a new medicine batch |

### 3. Medicines Catalog
| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/api/medicines` | Medicine list with real-time stock-in-hand |
| `GET` | `/api/medicines/:id` | Medicine details and active batch list |
| `POST` | `/api/medicines` | Add a new medicine |

### 4. Billing & Invoicing (ACID Transactions + MySQL Triggers)
| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/api/invoices` | List all historical invoices |
| `GET` | `/api/invoices/:id` | Full breakdown with customer & item details (**Query 4**) |
| `POST` | `/api/invoices` | Create invoice & items. **Protected by triggers:** blocks sale if expired or out of stock! |

### 5. Audit Trail & Batch Recall
| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/api/trace/batch/:batchNo` | Trace all customers who bought a recalled batch (**Query 3**) |

---

## 🛡️ Business Rules Enforced by Triggers
* **`trg_before_invoice_item_insert`**: Prevents selling any expired batch (`SQLSTATE 45000: Sale Blocked: This medicine batch has already expired!`) and prevents overselling beyond `QtyInHand`.
* **`trg_after_invoice_item_insert`**: Automatically deducts batch stock and calculates total invoice amount in real-time.
