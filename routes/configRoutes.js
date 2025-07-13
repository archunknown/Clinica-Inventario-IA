const express = require('express');
const router = express.Router();
const ConfigController = require('../controllers/configController');

// Obtener datos del perfil del usuario
router.get('/perfil', ConfigController.obtenerPerfil);

// Actualizar contraseña
router.put('/password', ConfigController.actualizarPassword);

// Actualizar perfil
router.put('/perfil', ConfigController.actualizarPerfil);

module.exports = router;
