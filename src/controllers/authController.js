const db = require('../config/db');

// Built-in fallback user credentials in case DB connection is initializing or offline
const DEFAULT_USERS = [
    {
        username: 'admin',
        password: 'admin123',
        fullName: 'Dr. Sarah Jenkins',
        role: 'admin',
        email: 'admin@pharmachain.internal',
        avatar: '👑'
    },
    {
        username: 'sales',
        password: 'sales123',
        fullName: 'Alex Rivera',
        role: 'salesperson',
        email: 'alex.counter@pharmachain.internal',
        avatar: '🛒'
    },
    {
        username: 'salesperson',
        password: 'salesperson123',
        fullName: 'Maria Santos',
        role: 'salesperson',
        email: 'maria.dispensing@pharmachain.internal',
        avatar: '🛒'
    },
    {
        username: 'customer',
        password: 'customer123',
        fullName: 'Rahul Sharma',
        role: 'customer',
        email: 'rahul.sharma@example.com',
        avatar: '🛍️',
        customerId: 1,
        phone: '+91 9811223344',
        address: 'Flat 302, Green Acres, Viman Nagar, Pune',
        city: 'Pune',
        pincode: '411014',
        age: 32,
        gender: 'Male',
        bloodGroup: 'O+',
        allergies: 'None'
    },
    {
        username: 'priya',
        password: 'priya123',
        fullName: 'Priya Patel',
        role: 'customer',
        email: 'priya.patel@example.com',
        avatar: '🛍️',
        customerId: 2,
        phone: '+91 9723456789',
        address: 'House 14, Shanti Niketan, Ahmedabad',
        city: 'Ahmedabad',
        pincode: '380009',
        age: 28,
        gender: 'Female',
        bloodGroup: 'B+',
        allergies: 'Penicillin'
    }
];

// Initialize database table APP_USER if it does not already exist
async function initUserTable() {
    try {
        await db.query(`
            CREATE TABLE IF NOT EXISTS APP_USER (
                UserID INT AUTO_INCREMENT PRIMARY KEY,
                Username VARCHAR(50) NOT NULL UNIQUE,
                PasswordHash VARCHAR(255) NOT NULL,
                FullName VARCHAR(100) NOT NULL,
                Role ENUM('admin', 'salesperson', 'customer') NOT NULL,
                Email VARCHAR(100),
                CustomerID INT NULL,
                CreatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            ) ENGINE=InnoDB;
        `);

        // Check if users already seeded
        const [existing] = await db.query('SELECT COUNT(*) AS count FROM APP_USER');
        if (existing[0].count === 0) {
            for (const u of DEFAULT_USERS) {
                await db.query(
                    'INSERT IGNORE INTO APP_USER (Username, PasswordHash, FullName, Role, Email, CustomerID) VALUES (?, ?, ?, ?, ?, ?)',
                    [u.username, u.password, u.fullName, u.role, u.email, u.customerId || null]
                );
            }
            console.log('[Auth] APP_USER table initialized and default users seeded.');
        }
    } catch (err) {
        console.warn('[Auth] Database user table initialization skipped/offline:', err.message);
    }
}

// Run table setup on server load
initUserTable();

/**
 * POST /api/auth/login
 * Validates username & password for Admin, Salesperson, or Customer portal
 */
async function login(req, res, next) {
    try {
        const { username, password, portalRole } = req.body;

        if (!username || !password) {
            return res.status(400).json({
                success: false,
                message: 'Both username and password are required.'
            });
        }

        const trimmedUser = username.trim().toLowerCase();
        let userMatch = null;

        // 1. Try querying MySQL database
        try {
            const [rows] = await db.query(
                'SELECT UserID, Username, PasswordHash, FullName, Role, Email, CustomerID FROM APP_USER WHERE LOWER(Username) = ?',
                [trimmedUser]
            );
            if (rows.length > 0 && rows[0].PasswordHash === password) {
                const u = rows[0];
                let avatar = '👑';
                if (u.Role === 'salesperson') avatar = '🛒';
                if (u.Role === 'customer') avatar = '🛍️';

                userMatch = {
                    id: u.UserID,
                    username: u.Username,
                    fullName: u.FullName,
                    role: u.Role,
                    email: u.Email,
                    customerId: u.CustomerID,
                    avatar
                };

                // If customer, enrich with CUSTOMER record
                if (u.CustomerID) {
                    const [custRows] = await db.query('SELECT * FROM CUSTOMER WHERE CustomerID = ?', [u.CustomerID]);
                    if (custRows.length > 0) {
                        userMatch.customerProfile = custRows[0];
                    }
                }
            }
        } catch (dbErr) {
            console.warn('[Auth] DB lookup failed, falling back to memory store:', dbErr.message);
        }

        // 2. Fallback to memory store if DB did not yield or failed
        if (!userMatch) {
            const foundFallback = DEFAULT_USERS.find(
                u => u.username.toLowerCase() === trimmedUser && u.password === password
            );
            if (foundFallback) {
                userMatch = {
                    username: foundFallback.username,
                    fullName: foundFallback.fullName,
                    role: foundFallback.role,
                    email: foundFallback.email,
                    avatar: foundFallback.avatar,
                    customerId: foundFallback.customerId,
                    customerProfile: foundFallback.role === 'customer' ? {
                        CustomerID: foundFallback.customerId,
                        Name: foundFallback.fullName,
                        Phone: foundFallback.phone,
                        Email: foundFallback.email,
                        Address: foundFallback.address,
                        City: foundFallback.city,
                        Pincode: foundFallback.pincode,
                        Age: foundFallback.age,
                        Gender: foundFallback.gender,
                        BloodGroup: foundFallback.bloodGroup,
                        Allergies: foundFallback.allergies
                    } : null
                };
            }
        }

        if (!userMatch) {
            return res.status(401).json({
                success: false,
                message: 'Invalid username or password. Please verify your credentials.'
            });
        }

        // Check if portal restriction was specified and matches user role
        if (portalRole && portalRole !== userMatch.role) {
            const roleNames = {
                admin: 'Administrator',
                salesperson: 'Salesperson',
                customer: 'Customer'
            };
            return res.status(403).json({
                success: false,
                message: `Access Denied: This is a ${roleNames[userMatch.role] || userMatch.role} account. Please log in through the ${roleNames[userMatch.role] || userMatch.role} Portal.`
            });
        }

        // Generate session token
        const token = `pharma_sess_${Buffer.from(`${userMatch.username}:${Date.now()}`).toString('base64')}`;

        return res.json({
            success: true,
            message: `Welcome back, ${userMatch.fullName}!`,
            token,
            user: {
                username: userMatch.username,
                fullName: userMatch.fullName,
                role: userMatch.role,
                email: userMatch.email,
                avatar: userMatch.avatar,
                customerId: userMatch.customerId,
                customerProfile: userMatch.customerProfile
            }
        });
    } catch (err) {
        next(err);
    }
}

/**
 * POST /api/auth/register-customer
 * Registers a new patient / customer with full profile and creates portal login credentials
 */
async function registerCustomer(req, res, next) {
    const connection = await db.getConnection();
    try {
        await connection.beginTransaction();

        const {
            username,
            password,
            fullName,
            phone,
            email,
            address,
            city,
            pincode,
            age,
            gender,
            bloodGroup,
            allergies
        } = req.body;

        const effectiveName = (fullName || req.body.name || '').trim();

        if (!username || !password || !effectiveName || !phone || !address) {
            await connection.rollback();
            return res.status(400).json({
                success: false,
                message: 'Username, password, full name, phone number, and delivery address are required.'
            });
        }

        const trimmedUser = username.trim().toLowerCase();

        // Check if username already taken
        const [existing] = await connection.query(
            'SELECT UserID FROM APP_USER WHERE LOWER(Username) = ?',
            [trimmedUser]
        );
        if (existing.length > 0) {
            await connection.rollback();
            return res.status(409).json({
                success: false,
                message: `Username "${username}" is already taken. Please choose another.`
            });
        }

        // 1. Create CUSTOMER record
        const [custResult] = await connection.query(`
            INSERT INTO CUSTOMER (
                Name, Phone, Email, Address, City, Pincode, Age, Gender, BloodGroup, Allergies
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [
            effectiveName,
            phone.trim(),
            email ? email.trim() : null,
            address.trim(),
            city ? city.trim() : 'Pune',
            pincode ? pincode.trim() : '411001',
            age ? parseInt(age) : null,
            gender || 'Unspecified',
            bloodGroup || 'O+',
            allergies || 'None'
        ]);

        const customerId = custResult.insertId;

        // 2. Create APP_USER record
        await connection.query(`
            INSERT INTO APP_USER (
                Username, PasswordHash, FullName, Role, Email, CustomerID
            ) VALUES (?, ?, ?, 'customer', ?, ?)
        `, [
            trimmedUser,
            password,
            effectiveName,
            email ? email.trim() : null,
            customerId
        ]);

        await connection.commit();

        const customerProfile = {
            CustomerID: customerId,
            Name: effectiveName,
            Phone: phone ? phone.trim() : '',
            Email: email ? email.trim() : null,
            Address: address ? address.trim() : '',
            City: city ? city.trim() : 'Pune',
            Pincode: pincode ? pincode.trim() : '411001',
            Age: age ? parseInt(age) : null,
            Gender: gender || 'Unspecified',
            BloodGroup: bloodGroup || 'O+',
            Allergies: allergies ? allergies.trim() : 'None'
        };

        const token = `pharma_sess_${Buffer.from(`${trimmedUser}:${Date.now()}`).toString('base64')}`;

        return res.status(201).json({
            success: true,
            message: `Account created successfully! Welcome to PharmaManagement, ${effectiveName}.`,
            token,
            user: {
                username: trimmedUser,
                fullName: effectiveName,
                role: 'customer',
                email: email ? email.trim() : null,
                avatar: '🛍️',
                customerId,
                customerProfile
            }
        });
    } catch (err) {
        await connection.rollback();
        next(err);
    } finally {
        connection.release();
    }
}

/**
 * GET /api/auth/demo-credentials
 * Provides public reference for viva & testing demo accounts
 */
function getDemoUsers(req, res) {
    res.json({
        success: true,
        data: [
            {
                role: 'admin',
                label: 'Administrator Portal',
                username: 'admin',
                password: 'admin123',
                fullName: 'Dr. Sarah Jenkins',
                access: 'Full System, Risk Heatmap, Recall Audit, Valuation & Inventory'
            },
            {
                role: 'salesperson',
                label: 'Salesperson Counter',
                username: 'sales',
                password: 'sales123',
                fullName: 'Alex Rivera',
                access: 'Point-of-Sale Billing, Expiry Radar & Stock Lookup'
            },
            {
                role: 'customer',
                label: 'Customer / Patient Portal',
                username: 'customer',
                password: 'customer123',
                fullName: 'Rahul Sharma',
                access: 'Online Medicine Ordering, Cart Checkout, Order Receipts & Medical Profile'
            }
        ]
    });
}

/**
 * POST /api/auth/logout
 */
function logout(req, res) {
    res.json({
        success: true,
        message: 'Successfully logged out.'
    });
}

module.exports = {
    login,
    registerCustomer,
    getDemoUsers,
    logout
};
