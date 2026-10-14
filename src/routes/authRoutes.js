const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');

router.post('/login', authController.login);
router.post('/register-customer', authController.registerCustomer);
router.post('/logout', authController.logout);
router.get('/demo-credentials', authController.getDemoUsers);

module.exports = router;
