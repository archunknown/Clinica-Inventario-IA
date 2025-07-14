const VentaModel = require('../models/ventaModel');
const MedicamentoModel = require('../models/medicamentoModel');
const PDFService = require('../services/pdfService');

class VentasController {
    // Crear una nueva venta
    static async crearVenta(req, res) {
        try {
            console.log('=== INICIO CREAR VENTA ===');
            console.log('Body recibido:', JSON.stringify(req.body, null, 2));
            
            const { items, usuario_id, cliente } = req.body;

            // Validar datos requeridos
            if (!items || !Array.isArray(items) || items.length === 0) {
                console.log('ERROR: No hay items en la venta');
                return res.status(400).json({
                    success: false,
                    message: 'Debe proporcionar al menos un item para la venta'
                });
            }

            if (!usuario_id) {
                console.log('ERROR: No hay usuario_id');
                return res.status(400).json({
                    success: false,
                    message: 'Usuario requerido'
                });
            }

            console.log(`Procesando venta con ${items.length} items para usuario_id: ${usuario_id}`);

            // Manejar cliente si se proporciona
            let cliente_id = null;
            console.log('=== PROCESANDO CLIENTE ==='); // LOG DE DEPURACIÓN
            console.log('Datos del cliente recibidos:', JSON.stringify(cliente, null, 2)); // LOG DE DEPURACIÓN
            
            if (cliente && cliente.dni) {
                const ClienteModel = require('../models/clienteModel');
                
                try {
                    // Buscar si el cliente ya existe
                    console.log('Buscando cliente con DNI:', cliente.dni); // LOG DE DEPURACIÓN
                    let clienteExistente = await ClienteModel.buscarPorDNI(cliente.dni);
                    console.log('Resultado de búsqueda:', clienteExistente); // LOG DE DEPURACIÓN
                    
                    if (!clienteExistente) {
                        // Crear nuevo cliente
                        console.log('Cliente no existe, creando nuevo...'); // LOG DE DEPURACIÓN
                        const datosNuevoCliente = {
                            dni: cliente.dni,
                            nombre: cliente.nombre,
                            apellido_paterno: cliente.apellido_paterno,
                            apellido_materno: cliente.apellido_materno
                        };
                        console.log('Datos para crear cliente:', JSON.stringify(datosNuevoCliente, null, 2)); // LOG DE DEPURACIÓN
                        
                        clienteExistente = await ClienteModel.crear(datosNuevoCliente);
                        console.log('Cliente creado exitosamente:', clienteExistente); // LOG DE DEPURACIÓN
                    } else {
                        console.log('Cliente ya existe, usando el existente'); // LOG DE DEPURACIÓN
                    }
                    
                    cliente_id = clienteExistente.id;
                    console.log('Cliente ID asignado a la venta:', cliente_id); // LOG DE DEPURACIÓN
                } catch (errorCliente) {
                    console.error('ERROR al procesar cliente:', errorCliente); // LOG DE DEPURACIÓN
                    console.error('Detalles del error:', {
                        message: errorCliente.message,
                        code: errorCliente.code,
                        detail: errorCliente.detail
                    });
                    // No lanzamos el error para que la venta pueda continuar sin cliente
                    console.log('La venta continuará sin cliente debido al error'); // LOG DE DEPURACIÓN
                }
            } else {
                console.log('No se proporcionaron datos de cliente o falta DNI'); // LOG DE DEPURACIÓN
            }
            console.log('=== FIN PROCESAMIENTO CLIENTE ==='); // LOG DE DEPURACIÓN

            // Verificar stock disponible
            const verificacionStock = await VentaModel.verificarStock(items);
            if (!verificacionStock.disponible) {
                return res.status(400).json({
                    success: false,
                    message: 'Stock insuficiente para algunos productos',
                    errores: verificacionStock.errores
                });
            }

            // Calcular total
            let total = 0;
            const itemsConPrecios = [];

            for (const item of items) {
                const medicamento = await MedicamentoModel.getById(item.medicamento_id);
                if (!medicamento) {
                    return res.status(404).json({
                        success: false,
                        message: `Medicamento con ID ${item.medicamento_id} no encontrado`
                    });
                }

                const subtotal = parseFloat(medicamento.precio) * parseInt(item.cantidad);
                total += subtotal;

                itemsConPrecios.push({
                    medicamento_id: item.medicamento_id,
                    cantidad: parseInt(item.cantidad),
                    subtotal: subtotal
                });
            }

            // Crear la venta
            const ventaData = {
                usuario_id: parseInt(usuario_id),
                cliente_id: cliente_id,
                total: total,
                items: itemsConPrecios
            };

            const resultado = await VentaModel.crear(ventaData);

            res.json({
                success: true,
                message: 'Venta creada exitosamente',
                data: {
                    venta_id: resultado.venta_id,
                    total: total,
                    fecha: resultado.fecha,
                    items: itemsConPrecios.length,
                    cliente: cliente_id ? cliente : null
                }
            });

        } catch (error) {
            console.error('Error al crear venta:', error);
            res.status(500).json({
                success: false,
                message: 'Error interno del servidor al crear la venta'
            });
        }
    }

    // Obtener todas las ventas
    static async getVentas(req, res) {
        try {
            const { limit = 50, offset = 0 } = req.query;
            const ventas = await VentaModel.getAll(parseInt(limit), parseInt(offset));

            res.json({
                success: true,
                data: ventas
            });

        } catch (error) {
            console.error('Error al obtener ventas:', error);
            res.status(500).json({
                success: false,
                message: 'Error al obtener las ventas'
            });
        }
    }

    // Obtener venta por ID
    static async getVentaById(req, res) {
        try {
            const { id } = req.params;
            const venta = await VentaModel.getById(parseInt(id));

            if (!venta) {
                return res.status(404).json({
                    success: false,
                    message: 'Venta no encontrada'
                });
            }

            res.json({
                success: true,
                data: venta
            });

        } catch (error) {
            console.error('Error al obtener venta:', error);
            res.status(500).json({
                success: false,
                message: 'Error al obtener la venta'
            });
        }
    }

    // Obtener estadísticas de ventas
    static async getStats(req, res) {
        try {
            const { fecha_inicio, fecha_fin } = req.query;
            const stats = await VentaModel.getStats(fecha_inicio, fecha_fin);

            res.json({
                success: true,
                data: {
                    total_ventas: parseInt(stats.total_ventas),
                    total_ingresos: parseFloat(stats.total_ingresos),
                    promedio_venta: parseFloat(stats.promedio_venta),
                    ventas_hoy: parseInt(stats.ventas_hoy),
                    ingresos_hoy: parseFloat(stats.ingresos_hoy)
                }
            });

        } catch (error) {
            console.error('Error al obtener estadísticas:', error);
            res.status(500).json({
                success: false,
                message: 'Error al obtener estadísticas de ventas'
            });
        }
    }

    // Obtener ventas por fecha
    static async getVentasByFecha(req, res) {
        try {
            const { fecha } = req.params;
            const ventas = await VentaModel.getByFecha(fecha);

            res.json({
                success: true,
                data: ventas
            });

        } catch (error) {
            console.error('Error al obtener ventas por fecha:', error);
            res.status(500).json({
                success: false,
                message: 'Error al obtener ventas por fecha'
            });
        }
    }

    // Verificar stock para carrito
    static async verificarStock(req, res) {
        try {
            const { items } = req.body;

            if (!items || !Array.isArray(items)) {
                return res.status(400).json({
                    success: false,
                    message: 'Debe proporcionar una lista de items'
                });
            }

            const verificacion = await VentaModel.verificarStock(items);

            res.json({
                success: true,
                data: verificacion
            });

        } catch (error) {
            console.error('Error al verificar stock:', error);
            res.status(500).json({
                success: false,
                message: 'Error al verificar stock'
            });
        }
    }

    // Obtener productos más vendidos
    static async getProductosMasVendidos(req, res) {
        try {
            const { limit = 10 } = req.query;
            
            // Esta consulta necesitaría ser implementada en el modelo
            // Por ahora devolvemos datos de ejemplo
            res.json({
                success: true,
                data: [],
                message: 'Funcionalidad en desarrollo'
            });

        } catch (error) {
            console.error('Error al obtener productos más vendidos:', error);
            res.status(500).json({
                success: false,
                message: 'Error al obtener productos más vendidos'
            });
        }
    }

    // Generar PDF de boleta
    static async generarBoletaPDF(req, res) {
        try {
            const { id } = req.params;
            
            // Obtener datos de la venta
            const venta = await VentaModel.getById(parseInt(id));
            if (!venta) {
                return res.status(404).json({
                    success: false,
                    message: 'Venta no encontrada'
                });
            }

            // Preparar datos para el PDF
            const ventaData = {
                venta_id: venta.id,
                total: parseFloat(venta.total),
                fecha: venta.fecha,
                usuario_nombre: venta.usuario_nombre || 'Usuario',
                items: venta.detalles.map(detalle => ({
                    nombre: detalle.medicamento_nombre,
                    cantidad: detalle.cantidad,
                    precio_unitario: parseFloat(detalle.precio_unitario),
                    subtotal: parseFloat(detalle.subtotal)
                }))
            };

            // Agregar datos del cliente si existe
            if (venta.cliente_id) {
                // Los datos del cliente ya vienen en la consulta del modelo VentaModel.getById
                ventaData.cliente = {
                    dni: venta.cliente_dni,
                    nombre: venta.cliente_nombre,
                    apellido_paterno: venta.cliente_apellido_paterno,
                    apellido_materno: venta.cliente_apellido_materno,
                    nombre_completo: venta.cliente_nombre_completo || 
                        `${venta.cliente_nombre || ''} ${venta.cliente_apellido_paterno || ''} ${venta.cliente_apellido_materno || ''}`.trim()
                };
                
                console.log('Datos del cliente para PDF:', ventaData.cliente); // LOG DE DEPURACIÓN
            } else {
                console.log('No hay cliente_id en la venta'); // LOG DE DEPURACIÓN
            }

            // Generar PDF
            const pdfBuffer = await PDFService.generarBoletaPDF(ventaData);

            // Configurar headers para descarga
            res.setHeader('Content-Type', 'application/pdf');
            res.setHeader('Content-Disposition', `attachment; filename="boleta-${String(venta.id).padStart(6, '0')}.pdf"`);
            res.setHeader('Content-Length', pdfBuffer.length);
            res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
            res.setHeader('Pragma', 'no-cache');
            res.setHeader('Expires', '0');

            // Enviar PDF
            res.end(pdfBuffer, 'binary');

        } catch (error) {
            console.error('Error al generar PDF:', error);
            res.status(500).json({
                success: false,
                message: 'Error al generar la boleta PDF'
            });
        }
    }
}

module.exports = VentasController;
