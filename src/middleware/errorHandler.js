/**
 * Centralized Error Handling Middleware
 * Converts MySQL trigger signals and database exceptions into clean HTTP responses
 */
function errorHandler(err, req, res, next) {
    console.error(`[Error] ${req.method} ${req.originalUrl}:`, err.message);

    // MySQL custom trigger errors (SQLSTATE 45000)
    if (err.sqlState === '45000') {
        return res.status(400).json({
            success: false,
            error: 'BusinessRuleViolation',
            message: err.sqlMessage || err.message
        });
    }

    // Foreign Key constraints
    if (err.code === 'ER_NO_REFERENCED_ROW_2') {
        return res.status(400).json({
            success: false,
            error: 'ForeignKeyViolation',
            message: 'Referenced entity does not exist (invalid MedicineID, SupplierID, or CustomerID).'
        });
    }

    if (err.code === 'ER_ROW_IS_REFERENCED_2') {
        return res.status(400).json({
            success: false,
            error: 'ForeignKeyConstraint',
            message: 'Cannot delete record because it is referenced by other records (e.g., invoices or batches).'
        });
    }

    // Duplicate entry (e.g. Unique constraint)
    if (err.code === 'ER_DUP_ENTRY') {
        return res.status(409).json({
            success: false,
            error: 'DuplicateEntry',
            message: err.sqlMessage || 'A duplicate record already exists.'
        });
    }

    // Default internal server error
    return res.status(500).json({
        success: false,
        error: 'InternalServerError',
        message: err.message || 'An unexpected server error occurred.'
    });
}

module.exports = errorHandler;
