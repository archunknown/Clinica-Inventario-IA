const express = require('express');
const router = express.Router();
const IAController = require('../controllers/iaController');

// Ruta principal para chat con IA
router.post('/chat', IAController.chat);

// Ruta para obtener sugerencias basadas en síntomas
router.post('/sugerencias', IAController.sugerencias);

// Ruta para verificar disponibilidad de un medicamento específico
router.get('/disponibilidad/:medicamento', IAController.verificarDisponibilidad);

// Ruta para buscar cliente por DNI o nombre
router.post('/buscar-cliente', IAController.buscarCliente);

// Ruta para obtener estadísticas de ventas
router.get('/estadisticas-ventas', IAController.obtenerEstadisticasVentas);

// Ruta para analizar inventario
router.get('/analizar-inventario', IAController.analizarInventario);

// Ruta para obtener estadísticas de uso (futuro)
router.get('/stats', IAController.getStats);

module.exports = router;
