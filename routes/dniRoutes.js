const express = require('express');
const router = express.Router();
const DNIController = require('../controllers/dniController');

// Ruta para consultar DNI
// GET /api/dni/:dni
router.get('/:dni', DNIController.consultarDNI);

module.exports = router;
