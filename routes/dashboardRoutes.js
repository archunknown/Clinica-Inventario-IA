const express = require('express');
const router = express.Router();
const DashboardController = require('../controllers/dashboardController');

// Ruta para obtener estadísticas generales del dashboard
router.get('/stats', DashboardController.getStats);

// Ruta para obtener recomendaciones climáticas (reemplaza productos más vendidos)
router.get('/top-productos', DashboardController.getRecomendacionesClima);

// Ruta para obtener actividad reciente
router.get('/actividad-reciente', DashboardController.getActividadReciente);

// Ruta para obtener productos con stock bajo
router.get('/stock-bajo', DashboardController.getStockBajo);

// Ruta para obtener datos de ventas mensuales
router.get('/ventas-mensuales', DashboardController.getVentasMensuales);

module.exports = router;
