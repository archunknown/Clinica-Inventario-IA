const express = require('express');
const router = express.Router();
const VentasController = require('../controllers/ventasController');

// Ruta para crear una nueva venta
router.post('/crear', VentasController.crearVenta);

// Ruta para obtener todas las ventas
router.get('/', VentasController.getVentas);

// Ruta para obtener venta por ID
router.get('/:id', VentasController.getVentaById);

// Ruta para obtener estadísticas de ventas
router.get('/stats/general', VentasController.getStats);

// Ruta para obtener ventas por fecha
router.get('/fecha/:fecha', VentasController.getVentasByFecha);

// Ruta para verificar stock antes de venta
router.post('/verificar-stock', VentasController.verificarStock);

// Ruta para obtener productos más vendidos
router.get('/stats/productos-mas-vendidos', VentasController.getProductosMasVendidos);

// Ruta para generar PDF de boleta
router.get('/:id/pdf', VentasController.generarBoletaPDF);

module.exports = router;
