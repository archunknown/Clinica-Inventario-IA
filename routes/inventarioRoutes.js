const express = require('express');
const router = express.Router();
const InventarioController = require('../controllers/inventarioController');

// Rutas para medicamentos - CRUD completo

// GET - Obtener todos los medicamentos
router.get('/', InventarioController.getMedicamentos);

// GET - Obtener medicamento por ID
router.get('/:id', InventarioController.getMedicamentoById);

// POST - Crear nuevo medicamento
router.post('/', InventarioController.createMedicamento);

// PUT - Actualizar medicamento completo
router.put('/:id', InventarioController.updateMedicamento);

// DELETE - Eliminar medicamento
router.delete('/:id', InventarioController.deleteMedicamento);

// PATCH - Actualizar solo stock
router.patch('/:id/stock', InventarioController.updateStock);

// Rutas adicionales de consulta

// GET - Buscar medicamentos
router.get('/search/query', InventarioController.searchMedicamentos);

// GET - Obtener medicamentos con stock bajo
router.get('/filter/low-stock', InventarioController.getLowStock);

// GET - Obtener estadísticas del inventario
router.get('/analytics/stats', InventarioController.getStats);

// Rutas legacy para compatibilidad (mantener las rutas anteriores)
router.get('/medicamentos', InventarioController.getMedicamentos);
router.get('/medicamentos/search', InventarioController.searchMedicamentos);
router.get('/medicamentos/low-stock', InventarioController.getLowStock);
router.get('/stats', InventarioController.getStats);

module.exports = router;
