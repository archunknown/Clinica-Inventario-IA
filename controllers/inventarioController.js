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

    // Obtener un medicamento por ID
    static async getMedicamentoById(req, res) {
        try {
            const { id } = req.params;
            const medicamento = await MedicamentoModel.getById(id);
            
            if (!medicamento) {
                return res.status(404).json({
                    success: false,
                    message: 'Medicamento no encontrado'
                });
            }

            res.json({
                success: true,
                data: medicamento
            });
        } catch (error) {
            console.error('Error al obtener medicamento:', error);
            res.status(500).json({
                success: false,
                message: 'Error al obtener el medicamento'
            });
        }
    }

    // Crear nuevo medicamento
    static async createMedicamento(req, res) {
        try {
            const { nombre, categoria, stock, precio, descripcion, unidad } = req.body;

            // Validaciones básicas
            if (!nombre || !categoria || stock === undefined || !precio) {
                return res.status(400).json({
                    success: false,
                    message: 'Faltan campos obligatorios: nombre, categoría, stock y precio'
                });
            }

            if (stock < 0 || precio <= 0) {
                return res.status(400).json({
                    success: false,
                    message: 'El stock debe ser mayor o igual a 0 y el precio mayor a 0'
                });
            }

            // Verificar si ya existe un medicamento con el mismo nombre
            const medicamentoExistente = await MedicamentoModel.getByName(nombre);
            if (medicamentoExistente) {
                return res.status(400).json({
                    success: false,
                    message: 'Ya existe un medicamento con ese nombre'
                });
            }

            const medicamentoData = {
                nombre: nombre.trim(),
                categoria,
                stock: parseInt(stock),
                precio: parseFloat(precio),
                descripcion: descripcion ? descripcion.trim() : null,
                unidad: unidad || 'unidades'
            };

            const nuevoMedicamento = await MedicamentoModel.create(medicamentoData);
            
            res.status(201).json({
                success: true,
                message: 'Medicamento creado correctamente',
                data: nuevoMedicamento
            });
        } catch (error) {
            console.error('Error al crear medicamento:', error);
            res.status(500).json({
                success: false,
                message: 'Error al crear el medicamento'
            });
        }
    }

    // Actualizar medicamento
    static async updateMedicamento(req, res) {
        try {
            const { id } = req.params;
            const { nombre, categoria, stock, precio, descripcion, unidad } = req.body;

            // Verificar si el medicamento existe
            const medicamentoExistente = await MedicamentoModel.getById(id);
            if (!medicamentoExistente) {
                return res.status(404).json({
                    success: false,
                    message: 'Medicamento no encontrado'
                });
            }

            // Validaciones básicas
            if (!nombre || !categoria || stock === undefined || !precio) {
                return res.status(400).json({
                    success: false,
                    message: 'Faltan campos obligatorios: nombre, categoría, stock y precio'
                });
            }

            if (stock < 0 || precio <= 0) {
                return res.status(400).json({
                    success: false,
                    message: 'El stock debe ser mayor o igual a 0 y el precio mayor a 0'
                });
            }

            // Verificar si ya existe otro medicamento con el mismo nombre
            const medicamentoConMismoNombre = await MedicamentoModel.getByName(nombre);
            if (medicamentoConMismoNombre && medicamentoConMismoNombre.id !== parseInt(id)) {
                return res.status(400).json({
                    success: false,
                    message: 'Ya existe otro medicamento con ese nombre'
                });
            }

            const medicamentoData = {
                nombre: nombre.trim(),
                categoria,
                stock: parseInt(stock),
                precio: parseFloat(precio),
                descripcion: descripcion ? descripcion.trim() : null,
                unidad: unidad || 'unidades'
            };

            const medicamentoActualizado = await MedicamentoModel.update(id, medicamentoData);
            
            res.json({
                success: true,
                message: 'Medicamento actualizado correctamente',
                data: medicamentoActualizado
            });
        } catch (error) {
            console.error('Error al actualizar medicamento:', error);
            res.status(500).json({
                success: false,
                message: 'Error al actualizar el medicamento'
            });
        }
    }

    // Eliminar medicamento (SOLUCIÓN DEFINITIVA - SIMPLE)
    static async deleteMedicamento(req, res) {
        try {
            const { id } = req.params;

            // Verificar si el medicamento existe
            const medicamentoExistente = await MedicamentoModel.getById(id);
            if (!medicamentoExistente) {
                return res.status(404).json({
                    success: false,
                    message: 'Medicamento no encontrado'
                });
            }

            // ELIMINACIÓN DIRECTA - Con CASCADE configurado, se eliminan automáticamente los detalles
            const resultado = await MedicamentoModel.delete(id);
            
            return res.json({
                success: true,
                message: 'Medicamento eliminado correctamente (incluyendo sus detalles de venta)',
                data: resultado
            });
            
        } catch (error) {
            console.error('Error al eliminar medicamento:', error);
            
            res.status(500).json({
                success: false,
                message: 'Error al eliminar el medicamento: ' + error.message
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

    // Actualizar stock de medicamento
    static async updateStock(req, res) {
        try {
            const { id } = req.params;
            const { stock, operacion } = req.body; // operacion: 'add', 'subtract', 'set'

            if (!stock || !operacion) {
                return res.status(400).json({
                    success: false,
                    message: 'Stock y operación son requeridos'
                });
            }

            const medicamento = await MedicamentoModel.getById(id);
            if (!medicamento) {
                return res.status(404).json({
                    success: false,
                    message: 'Medicamento no encontrado'
                });
            }

            let nuevoStock;
            switch (operacion) {
                case 'add':
                    nuevoStock = parseInt(medicamento.stock) + parseInt(stock);
                    break;
                case 'subtract':
                    nuevoStock = parseInt(medicamento.stock) - parseInt(stock);
                    if (nuevoStock < 0) nuevoStock = 0;
                    break;
                case 'set':
                    nuevoStock = parseInt(stock);
                    break;
                default:
                    return res.status(400).json({
                        success: false,
                        message: 'Operación no válida. Use: add, subtract, set'
                    });
            }

            const medicamentoActualizado = await MedicamentoModel.updateStock(id, nuevoStock);
            
            res.json({
                success: true,
                message: 'Stock actualizado correctamente',
                data: medicamentoActualizado
            });
        } catch (error) {
            console.error('Error al actualizar stock:', error);
            res.status(500).json({
                success: false,
                message: 'Error al actualizar el stock'
            });
        }
    }
}

module.exports = InventarioController;
