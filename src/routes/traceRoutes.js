const express = require('express');
const router = express.Router();
const traceController = require('../controllers/traceController');

router.get('/batch/:batchNo', traceController.traceBatch);

module.exports = router;
