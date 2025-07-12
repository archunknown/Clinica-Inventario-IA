const express = require('express');
const router = express.Router();
const AuthController = require('../controllers/authController');

// Ruta para login
router.post('/login', AuthController.login);

// Ruta para logout
router.post('/logout', AuthController.logout);

module.exports = router;
