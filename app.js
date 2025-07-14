const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middlewares
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Servir archivos estáticos
app.use(express.static('public'));
app.use('/views', express.static('views'));

// Ruta principal - servir el index.html
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Ruta para la página de ventas
app.get('/ventas', (req, res) => {
    res.sendFile(path.join(__dirname, 'views', 'ventas.html'));
});

// Importar rutas
const authRoutes = require('./routes/authRoutes');
const inventarioRoutes = require('./routes/inventarioRoutes');
const iaRoutes = require('./routes/iaRoutes');
const ventasRoutes = require('./routes/ventasRoutes');
const configRoutes = require('./routes/configRoutes');
const dashboardRoutes = require('./routes/dashboardRoutes');

// Usar rutas
app.use('/api/auth', authRoutes);
app.use('/api/inventario', inventarioRoutes);
app.use('/api/ia', iaRoutes);
app.use('/api/ventas', ventasRoutes);
app.use('/api/config', configRoutes);
app.use('/api/dashboard', dashboardRoutes);

// Manejo de errores
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ 
        success: false, 
        message: 'Error interno del servidor' 
    });
});

// Iniciar servidor
app.listen(PORT, '0.0.0.0', () => {
    console.log(`✅ Servidor corriendo en puerto ${PORT}`);
    console.log(`🌍 Ambiente: ${process.env.NODE_ENV || 'development'}`);
});

module.exports = app;
