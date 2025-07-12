const MedicamentoModel = require('../models/medicamentoModel');

class InventarioController {
    // Obtener todos los medicamentos
    static async getMedicamentos(req, res) {
        try {
            const medicamentos = await MedicamentoModel.getAll();
            res.json({
                success: true,
                data: medicamentos
            });
        } catch (error) {
            console.error('Error al obtener medicamentos:', error);
            res.status(500).json({
                success: false,
                message: 'Error al obtener los medicamentos'
            });
        }
    }

    // Buscar medicamentos
    static async searchMedicamentos(req, res) {
        try {
            const { q } = req.query;
            if (!q) {
                return res.status(400).json({
                    success: false,
                    message: 'Parámetro de búsqueda requerido'
                });
            }

            const medicamentos = await MedicamentoModel.search(q);
            res.json({
                success: true,
                data: medicamentos
            });
        } catch (error) {
            console.error('Error al buscar medicamentos:', error);
            res.status(500).json({
                success: false,
                message: 'Error al buscar medicamentos'
            });
        }
    }

    // Obtener medicamentos con stock bajo
    static async getLowStock(req, res) {
        try {
            const medicamentos = await MedicamentoModel.getLowStock();
            res.json({
                success: true,
                data: medicamentos
            });
        } catch (error) {
            console.error('Error al obtener medicamentos con stock bajo:', error);
            res.status(500).json({
                success: false,
                message: 'Error al obtener medicamentos con stock bajo'
            });
        }
    }

    // Obtener estadísticas del inventario
    static async getStats(req, res) {
        try {
            const stats = await MedicamentoModel.getStats();
            res.json({
                success: true,
                data: stats
            });
        } catch (error) {
            console.error('Error al obtener estadísticas:', error);
            res.status(500).json({
                success: false,
                message: 'Error al obtener estadísticas del inventario'
            });
        }
    }
}

module.exports = InventarioController;
