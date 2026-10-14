const db = require('./db');

async function migrate() {
    try {
        console.log('[Migration] Checking customer and user columns...');
        
        // 1. Update APP_USER Role ENUM to include 'customer'
        await db.query(`
            ALTER TABLE APP_USER 
            MODIFY COLUMN Role ENUM('admin', 'salesperson', 'customer') NOT NULL
        `);

        // 2. Check and add CUSTOMER table columns
        const [existingCols] = await db.query(`
            SELECT COLUMN_NAME 
            FROM information_schema.COLUMNS 
            WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'CUSTOMER'
        `);
        const colNames = existingCols.map(c => c.COLUMN_NAME.toLowerCase());

        const customerFields = [
            { name: 'Email', def: 'VARCHAR(100)' },
            { name: 'Age', def: 'INT' },
            { name: 'Gender', def: 'VARCHAR(20)' },
            { name: 'BloodGroup', def: 'VARCHAR(10)' },
            { name: 'Allergies', def: 'VARCHAR(255)' },
            { name: 'City', def: 'VARCHAR(100)' },
            { name: 'Pincode', def: 'VARCHAR(20)' }
        ];

        for (const field of customerFields) {
            if (!colNames.includes(field.name.toLowerCase())) {
                await db.query(`ALTER TABLE CUSTOMER ADD COLUMN ${field.name} ${field.def}`);
                console.log(`[Migration] Added column ${field.name} to CUSTOMER.`);
            }
        }

        // 3. Add CustomerID to APP_USER if missing
        const [userCols] = await db.query(`
            SELECT COLUMN_NAME 
            FROM information_schema.COLUMNS 
            WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'APP_USER'
        `);
        const userColNames = userCols.map(c => c.COLUMN_NAME.toLowerCase());
        if (!userColNames.includes('customerid')) {
            await db.query('ALTER TABLE APP_USER ADD COLUMN CustomerID INT NULL');
            console.log('[Migration] Added CustomerID to APP_USER.');
        }

        // 4. Update existing test customer #1 & #2 with profile info
        await db.query(`
            UPDATE CUSTOMER SET 
                Email = COALESCE(Email, 'rahul.sharma@example.com'),
                Age = COALESCE(Age, 32),
                Gender = COALESCE(Gender, 'Male'),
                BloodGroup = COALESCE(BloodGroup, 'O+'),
                Allergies = COALESCE(Allergies, 'None'),
                City = COALESCE(City, 'Pune'),
                Pincode = COALESCE(Pincode, '411014')
            WHERE CustomerID = 1
        `);

        await db.query(`
            UPDATE CUSTOMER SET 
                Email = COALESCE(Email, 'priya.patel@example.com'),
                Age = COALESCE(Age, 28),
                Gender = COALESCE(Gender, 'Female'),
                BloodGroup = COALESCE(BloodGroup, 'B+'),
                Allergies = COALESCE(Allergies, 'Penicillin'),
                City = COALESCE(City, 'Ahmedabad'),
                Pincode = COALESCE(Pincode, '380009')
            WHERE CustomerID = 2
        `);

        // 5. Seed default customer user accounts into APP_USER
        await db.query(`
            INSERT INTO APP_USER (Username, PasswordHash, FullName, Role, Email, CustomerID)
            VALUES 
                ('customer', 'customer123', 'Rahul Sharma', 'customer', 'rahul.sharma@example.com', 1),
                ('priya', 'priya123', 'Priya Patel', 'customer', 'priya.patel@example.com', 2)
            ON DUPLICATE KEY UPDATE 
                FullName = VALUES(FullName),
                Role = VALUES(Role),
                CustomerID = VALUES(CustomerID)
        `);

        console.log('[Migration] Successfully migrated customer columns and seeded default customer logins.');
        process.exit(0);
    } catch (err) {
        console.error('[Migration Error]:', err.message);
        process.exit(1);
    }
}

migrate();
