const express = require('express');
const router = express.Router();
const batchController = require('../controllers/batchController');

router.get('/', batchController.getAllBatches);
router.get('/near-expiry', batchController.getNearExpiryBatches);
router.get('/expired', batchController.getExpiredBatches);
router.post('/', batchController.createBatch);

module.exports = router;
