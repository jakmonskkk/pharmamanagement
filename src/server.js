const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config();

// Import Routes
const dashboardRoutes = require('./routes/dashboardRoutes');
const medicineRoutes = require('./routes/medicineRoutes');
const batchRoutes = require('./routes/batchRoutes');
const invoiceRoutes = require('./routes/invoiceRoutes');
const customerRoutes = require('./routes/customerRoutes');
const supplierRoutes = require('./routes/supplierRoutes');
const traceRoutes = require('./routes/traceRoutes');
const authRoutes = require('./routes/authRoutes');
const errorHandler = require('./middleware/errorHandler');

const app = express();
const PORT = process.env.PORT || 5000;

// Standard Middlewares
app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

// Serve Static Frontend / Interactive API Explorer
app.use(express.static(path.join(__dirname, 'public')));

// Health Check
app.get('/api/health', (req, res) => {
    res.json({
        status: 'UP',
        service: 'PharmaChain REST API',
        timestamp: new Date().toISOString()
    });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/medicines', medicineRoutes);
app.use('/api/batches', batchRoutes);
app.use('/api/invoices', invoiceRoutes);
app.use('/api/customers', customerRoutes);
app.use('/api/suppliers', supplierRoutes);
app.use('/api/trace', traceRoutes);

// 404 Route
app.use('/api/*', (req, res) => {
    res.status(404).json({
        success: false,
        error: 'NotFound',
        message: `Endpoint ${req.originalUrl} does not exist.`
    });
});

// Centralized Error Handler
app.use(errorHandler);

// Start Server
app.listen(PORT, () => {
    console.log(`=======================================================`);
    console.log(`🚀 PharmaChain Backend API running on port ${PORT}`);
    console.log(`🌐 Live API & Test Console: http://localhost:${PORT}`);
    console.log(`📡 Health Check: http://localhost:${PORT}/api/health`);
    console.log(`=======================================================`);
});
