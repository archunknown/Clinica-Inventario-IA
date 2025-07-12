const express = require('express');
const router = express.Router();
const InventarioController = require('../controllers/inventarioController');

// Ruta para obtener todos los medicamentos
router.get('/medicamentos', InventarioController.getMedicamentos);

// Ruta para buscar medicamentos
router.get('/medicamentos/search', InventarioController.searchMedicamentos);

// Ruta para obtener medicamentos con stock bajo
router.get('/medicamentos/low-stock', InventarioController.getLowStock);

// Ruta para obtener estadísticas
router.get('/stats', InventarioController.getStats);

module.exports = router;
