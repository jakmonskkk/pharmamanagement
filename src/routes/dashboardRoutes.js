const express = require('express');
const router = express.Router();
const dashboardController = require('../controllers/dashboardController');

router.get('/summary', dashboardController.getSummary);
router.get('/category-valuation', dashboardController.getCategoryValuation);

module.exports = router;
