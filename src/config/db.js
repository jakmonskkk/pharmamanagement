const mysql = require('mysql2/promise');
const dotenv = require('dotenv');

dotenv.config();

// Create connection pool for high-concurrency and resilience
const pool = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'pharmachain_db',
    port: Number(process.env.DB_PORT) || 3306,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    timezone: '+00:00'
});

// Test connection on startup
async function testConnection() {
    try {
        const connection = await pool.getConnection();
        console.log(`[DB] Connected to MySQL database "${process.env.DB_NAME || 'pharmachain_db'}" successfully.`);
        connection.release();
    } catch (err) {
        console.error('[DB] Connection error:', err.message);
        console.warn('[DB] Please check your .env credentials or ensure MySQL server is running.');
    }
}

testConnection();

module.exports = pool;
