const db = require('../config/db');

/**
 * GET /api/customers
 * Search / list customers
 */
async function getAllCustomers(req, res, next) {
    try {
        const { search } = req.query;
        let sql = 'SELECT * FROM CUSTOMER WHERE 1=1';
        const params = [];

        if (search) {
            sql += ' AND (Name LIKE ? OR Phone LIKE ? OR Email LIKE ?)';
            params.push(`%${search}%`, `%${search}%`, `%${search}%`);
        }

        sql += ' ORDER BY Name ASC';
        const [rows] = await db.query(sql, params);
        res.json({ success: true, count: rows.length, data: rows });
    } catch (err) {
        next(err);
    }
}

/**
 * GET /api/customers/:id
 * Retrieve full customer profile
 */
async function getCustomerById(req, res, next) {
    try {
        const { id } = req.params;
        const [rows] = await db.query('SELECT * FROM CUSTOMER WHERE CustomerID = ?', [id]);
        if (rows.length === 0) {
            return res.status(404).json({ success: false, message: 'Customer not found.' });
        }
        res.json({ success: true, data: rows[0] });
    } catch (err) {
        next(err);
    }
}

/**
 * GET /api/customers/:id/orders
 * Returns all past invoices & purchases made by this customer
 */
async function getCustomerOrders(req, res, next) {
    try {
        const { id } = req.params;
        const [invoices] = await db.query(`
            SELECT 
                i.InvoiceID,
                i.InvoiceDate,
                i.TotalAmount,
                COUNT(ii.ItemID) AS TotalItems
            FROM INVOICE i
            LEFT JOIN INVOICE_ITEM ii ON i.InvoiceID = ii.InvoiceID
            WHERE i.CustomerID = ?
            GROUP BY i.InvoiceID, i.InvoiceDate, i.TotalAmount
            ORDER BY i.InvoiceID DESC
        `, [id]);

        // Get details for all items
        for (let inv of invoices) {
            const [items] = await db.query(`
                SELECT 
                    ii.ItemID,
                    ii.Quantity,
                    ii.UnitPrice,
                    ii.Discount,
                    ((ii.Quantity * ii.UnitPrice) - ii.Discount) AS LineTotal,
                    b.BatchNo,
                    b.ExpiryDate,
                    m.Name AS MedicineName,
                    m.Category,
                    m.Unit
                FROM INVOICE_ITEM ii
                JOIN BATCH b ON ii.BatchID = b.BatchID
                JOIN MEDICINE m ON b.MedicineID = m.MedicineID
                WHERE ii.InvoiceID = ?
            `, [inv.InvoiceID]);
            inv.items = items;
        }

        res.json({ success: true, count: invoices.length, data: invoices });
    } catch (err) {
        next(err);
    }
}

/**
 * POST /api/customers
 * Register customer with all essential medical & delivery fields
 */
async function createCustomer(req, res, next) {
    try {
        const body = req.body || {};
        const Name = body.Name || body.name || body.fullName;
        const Phone = body.Phone || body.phone;
        const Email = body.Email || body.email;
        const Address = body.Address || body.address;
        const City = body.City || body.city || 'Pune';
        const Pincode = body.Pincode || body.pincode || '411001';
        const Age = body.Age !== undefined ? body.Age : body.age;
        const Gender = body.Gender || body.gender || 'Unspecified';
        const BloodGroup = body.BloodGroup || body.bloodGroup || 'O+';
        const Allergies = body.Allergies || body.allergies || 'None';

        if (!Name || !Phone || !Address) {
            return res.status(400).json({ 
                success: false, 
                message: 'Name, Phone, and Delivery Address are mandatory.' 
            });
        }

        const [result] = await db.query(`
            INSERT INTO CUSTOMER (
                Name, Phone, Email, Address, City, Pincode, Age, Gender, BloodGroup, Allergies
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [
            Name.trim(), 
            Phone.trim(), 
            Email ? Email.trim() : null, 
            Address.trim(), 
            City ? City.trim() : 'Pune', 
            Pincode ? Pincode.trim() : '411001', 
            Age ? parseInt(Age) : null, 
            Gender, 
            BloodGroup, 
            Allergies
        ]);

        const customerId = result.insertId;

        res.status(201).json({
            success: true,
            message: 'Customer profile registered successfully.',
            data: { 
                CustomerID: customerId, 
                Name, 
                Phone, 
                Email, 
                Address, 
                City, 
                Pincode, 
                Age, 
                Gender, 
                BloodGroup, 
                Allergies 
            }
        });
    } catch (err) {
        next(err);
    }
}

/**
 * PUT /api/customers/:id
 * Update customer profile details
 */
async function updateCustomer(req, res, next) {
    try {
        const { id } = req.params;
        const body = req.body || {};
        const Name = body.Name !== undefined ? body.Name : (body.name || body.fullName);
        const Phone = body.Phone !== undefined ? body.Phone : body.phone;
        const Email = body.Email !== undefined ? body.Email : body.email;
        const Address = body.Address !== undefined ? body.Address : body.address;
        const City = body.City !== undefined ? body.City : body.city;
        const Pincode = body.Pincode !== undefined ? body.Pincode : body.pincode;
        const Age = body.Age !== undefined ? body.Age : body.age;
        const Gender = body.Gender !== undefined ? body.Gender : body.gender;
        const BloodGroup = body.BloodGroup !== undefined ? body.BloodGroup : body.bloodGroup;
        const Allergies = body.Allergies !== undefined ? body.Allergies : body.allergies;

        await db.query(`
            UPDATE CUSTOMER SET
                Name = COALESCE(?, Name),
                Phone = COALESCE(?, Phone),
                Email = COALESCE(?, Email),
                Address = COALESCE(?, Address),
                City = COALESCE(?, City),
                Pincode = COALESCE(?, Pincode),
                Age = COALESCE(?, Age),
                Gender = COALESCE(?, Gender),
                BloodGroup = COALESCE(?, BloodGroup),
                Allergies = COALESCE(?, Allergies)
            WHERE CustomerID = ?
        `, [
            Name !== undefined ? (Name ? Name.trim() : Name) : null,
            Phone !== undefined ? (Phone ? Phone.trim() : Phone) : null,
            Email !== undefined ? (Email ? Email.trim() : null) : null,
            Address !== undefined ? (Address ? Address.trim() : Address) : null,
            City !== undefined ? (City ? City.trim() : City) : null,
            Pincode !== undefined ? (Pincode ? Pincode.trim() : Pincode) : null,
            Age !== undefined && Age !== null ? parseInt(Age) : null,
            Gender || null,
            BloodGroup || null,
            Allergies || null,
            id
        ]);

        // Keep APP_USER display name and email synchronized
        if (Name || Email) {
            await db.query(`
                UPDATE APP_USER SET
                    FullName = COALESCE(?, FullName),
                    Email = COALESCE(?, Email)
                WHERE CustomerID = ?
            `, [Name ? Name.trim() : null, Email ? Email.trim() : null, id]).catch(() => {});
        }

        const [rows] = await db.query('SELECT * FROM CUSTOMER WHERE CustomerID = ?', [id]);
        if (rows.length === 0) {
            return res.status(404).json({ success: false, message: 'Customer not found.' });
        }
        res.json({ success: true, message: 'Profile updated successfully.', data: rows[0] });
    } catch (err) {
        next(err);
    }
}

module.exports = {
    getAllCustomers,
    getCustomerById,
    getCustomerOrders,
    createCustomer,
    updateCustomer
};
