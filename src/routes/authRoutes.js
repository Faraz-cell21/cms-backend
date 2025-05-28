const express = require('express');
const { login, logout } = require('../controllers/authController');
const router = express.Router();

// POST /api/auth/login
router.post('/login', login);

// GET /api/auth/logout
router.get('/logout', logout);
module.exports = router;
