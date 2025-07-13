const IAInventarioService = require('../services/iaInventarioService');

class IAController {
    // Procesar consulta de chat
    static async chat(req, res) {
        try {
            const { prompt } = req.body;

            if (!prompt || prompt.trim() === '') {
                return res.status(400).json({
                    success: false,
                    message: 'La pregunta no puede estar vacía'
                });
            }

            // Procesar la consulta con el servicio de IA
            const resultado = await IAInventarioService.procesarConsulta(prompt);

            if (resultado.success) {
                res.json({
                    success: true,
                    respuesta: resultado.respuesta,
                    timestamp: resultado.timestamp
                });
            } else {
                res.status(500).json({
                    success: false,
                    message: resultado.error || 'Error al procesar la consulta',
                    respuesta: resultado.respuesta
                });
            }

        } catch (error) {
            console.error('Error en controlador IA:', error);
            res.status(500).json({
                success: false,
                message: 'Error interno del servidor',
                respuesta: 'Lo siento, ocurrió un error al procesar tu consulta.'
            });
        }
    }

    // Obtener sugerencias por síntomas
    static async sugerencias(req, res) {
        try {
            const { sintomas } = req.body;

            if (!sintomas || sintomas.trim() === '') {
                return res.status(400).json({
                    success: false,
                    message: 'Debe proporcionar síntomas para obtener sugerencias'
                });
            }

            const resultado = await IAInventarioService.obtenerSugerencias(sintomas);

            res.json(resultado);

        } catch (error) {
            console.error('Error al obtener sugerencias:', error);
            res.status(500).json({
                success: false,
                message: 'Error al obtener sugerencias'
            });
        }
    }

    // Verificar disponibilidad de medicamento
    static async verificarDisponibilidad(req, res) {
        try {
            const { medicamento } = req.params;

            if (!medicamento) {
                return res.status(400).json({
                    success: false,
                    message: 'Debe especificar un medicamento'
                });
            }

            const resultado = await IAInventarioService.verificarDisponibilidad(medicamento);

            res.json(resultado);

        } catch (error) {
            console.error('Error al verificar disponibilidad:', error);
            res.status(500).json({
                success: false,
                message: 'Error al verificar disponibilidad'
            });
        }
    }

    // Buscar cliente por DNI o nombre
    static async buscarCliente(req, res) {
        try {
            const { busqueda } = req.body;

            if (!busqueda) {
                return res.status(400).json({
                    success: false,
                    message: 'Debe proporcionar un término de búsqueda'
                });
            }

            const resultado = await IAInventarioService.buscarCliente(busqueda);

            res.json(resultado);

        } catch (error) {
            console.error('Error en búsqueda de cliente:', error);
            res.status(500).json({
                success: false,
                message: 'Error interno del servidor'
            });
        }
    }

    // Obtener estadísticas de ventas
    static async obtenerEstadisticasVentas(req, res) {
        try {
            const resultado = await IAInventarioService.obtenerEstadisticasVentas();
            res.json(resultado);

        } catch (error) {
            console.error('Error al obtener estadísticas de ventas:', error);
            res.status(500).json({
                success: false,
                message: 'Error interno del servidor'
            });
        }
    }

    // Analizar inventario
    static async analizarInventario(req, res) {
        try {
            const resultado = await IAInventarioService.analizarInventario();
            res.json(resultado);

        } catch (error) {
            console.error('Error al analizar inventario:', error);
            res.status(500).json({
                success: false,
                message: 'Error interno del servidor'
            });
        }
    }

    // Obtener estadísticas de uso de IA (para futuro dashboard)
    static async getStats(req, res) {
        try {
            // Por ahora retornamos estadísticas básicas
            res.json({
                success: true,
                stats: {
                    totalConsultas: 0,
                    consultasHoy: 0,
                    tiempoPromedioRespuesta: '2.5s',
                    satisfaccion: '95%'
                }
            });
        } catch (error) {
            console.error('Error al obtener estadísticas:', error);
            res.status(500).json({
                success: false,
                message: 'Error al obtener estadísticas'
            });
        }
    }
}

module.exports = IAController;
