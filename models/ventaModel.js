const db = require('./db');

class VentaModel {
    // Crear una nueva venta
    static async crear(ventaData) {
        const client = await db.connect();
        try {
            await client.query('BEGIN');

            // Insertar la venta principal
            const ventaQuery = `
                INSERT INTO ventas (usuario_id, cliente_id, total, fecha)
                VALUES ($1, $2, $3, NOW())
                RETURNING id, fecha
            `;
            const ventaResult = await client.query(ventaQuery, [
                ventaData.usuario_id,
                ventaData.cliente_id || null,
                ventaData.total
            ]);

            const ventaId = ventaResult.rows[0].id;

            // Insertar los detalles de la venta
            for (const item of ventaData.items) {
                // Calcular precio unitario
                const precioUnitario = item.subtotal / item.cantidad;
                
                const detalleQuery = `
                    INSERT INTO detalle_venta (venta_id, medicamento_id, cantidad, subtotal, precio_unitario)
                    VALUES ($1, $2, $3, $4, $5)
                `;
                await client.query(detalleQuery, [
                    ventaId,
                    item.medicamento_id,
                    item.cantidad,
                    item.subtotal,
                    precioUnitario
                ]);

                // Actualizar el stock del medicamento
                const updateStockQuery = `
                    UPDATE medicamentos 
                    SET stock = stock - $1 
                    WHERE id = $2
                `;
                await client.query(updateStockQuery, [item.cantidad, item.medicamento_id]);
            }

            await client.query('COMMIT');
            return {
                success: true,
                venta_id: ventaId,
                fecha: ventaResult.rows[0].fecha
            };

        } catch (error) {
            await client.query('ROLLBACK');
            console.error('Error al crear venta:', error);
            console.error('Detalles del error:', {
                message: error.message,
                code: error.code,
                detail: error.detail,
                table: error.table,
                constraint: error.constraint,
                stack: error.stack
            });
            throw error;
        } finally {
            client.release();
        }
    }

    // Obtener todas las ventas
    static async getAll(limit = 50, offset = 0) {
        try {
            const query = `
                SELECT v.*, u.username as usuario_nombre,
                       c.dni as cliente_dni,
                       CONCAT(c.nombre, ' ', c.apellido_paterno, ' ', c.apellido_materno) as cliente_nombre,
                       COUNT(vd.id) as total_items
                FROM ventas v
                LEFT JOIN usuarios u ON v.usuario_id = u.id
                LEFT JOIN clientes c ON v.cliente_id = c.id
                LEFT JOIN detalle_venta vd ON v.id = vd.venta_id
                GROUP BY v.id, u.username, c.dni, c.nombre, c.apellido_paterno, c.apellido_materno
                ORDER BY v.fecha DESC
                LIMIT $1 OFFSET $2
            `;
            const result = await db.query(query, [limit, offset]);
            return result.rows;
        } catch (error) {
            console.error('Error al obtener ventas:', error);
            throw error;
        }
    }

    // Obtener venta por ID con detalles
    static async getById(id) {
        try {
            const ventaQuery = `
                SELECT v.*, u.username as usuario_nombre,
                       c.dni as cliente_dni,
                       c.nombre as cliente_nombre,
                       c.apellido_paterno as cliente_apellido_paterno,
                       c.apellido_materno as cliente_apellido_materno,
                       CONCAT(c.nombre, ' ', c.apellido_paterno, ' ', c.apellido_materno) as cliente_nombre_completo
                FROM ventas v
                LEFT JOIN usuarios u ON v.usuario_id = u.id
                LEFT JOIN clientes c ON v.cliente_id = c.id
                WHERE v.id = $1
            `;
            const ventaResult = await db.query(ventaQuery, [id]);

            if (ventaResult.rows.length === 0) {
                return null;
            }

            const venta = ventaResult.rows[0];

            // Obtener detalles de la venta
            const detallesQuery = `
                SELECT vd.*, m.nombre as medicamento_nombre, m.categoria, m.precio as precio_unitario
                FROM detalle_venta vd
                JOIN medicamentos m ON vd.medicamento_id = m.id
                WHERE vd.venta_id = $1
                ORDER BY vd.id
            `;
            const detallesResult = await db.query(detallesQuery, [id]);

            venta.detalles = detallesResult.rows;
            return venta;

        } catch (error) {
            console.error('Error al obtener venta por ID:', error);
            throw error;
        }
    }

    // Obtener estadísticas de ventas
    static async getStats(fechaInicio = null, fechaFin = null) {
        try {
            let whereClause = '';
            let params = [];

            if (fechaInicio && fechaFin) {
                whereClause = 'WHERE v.fecha BETWEEN $1 AND $2';
                params = [fechaInicio, fechaFin];
            }

            const query = `
                SELECT 
                    COUNT(*) as total_ventas,
                    COALESCE(SUM(v.total), 0) as total_ingresos,
                    COALESCE(AVG(v.total), 0) as promedio_venta,
                    COUNT(CASE WHEN DATE(v.fecha) = CURRENT_DATE THEN 1 END) as ventas_hoy,
                    COALESCE(SUM(CASE WHEN DATE(v.fecha) = CURRENT_DATE THEN v.total END), 0) as ingresos_hoy
                FROM ventas v
                ${whereClause}
            `;

            const result = await db.query(query, params);
            return result.rows[0];

        } catch (error) {
            console.error('Error al obtener estadísticas de ventas:', error);
            throw error;
        }
    }

    // Obtener ventas por fecha
    static async getByFecha(fecha) {
        try {
            const query = `
                SELECT v.*, u.username as usuario_nombre,
                       COUNT(vd.id) as total_items
                FROM ventas v
                LEFT JOIN usuarios u ON v.usuario_id = u.id
                LEFT JOIN detalle_venta vd ON v.id = vd.venta_id
                WHERE DATE(v.fecha) = $1
                GROUP BY v.id, u.username
                ORDER BY v.fecha DESC
            `;
            const result = await db.query(query, [fecha]);
            return result.rows;
        } catch (error) {
            console.error('Error al obtener ventas por fecha:', error);
            throw error;
        }
    }

    // Verificar disponibilidad de stock antes de venta
    static async verificarStock(items) {
        try {
            const stockInsuficiente = [];

            for (const item of items) {
                const query = 'SELECT id, nombre, stock FROM medicamentos WHERE id = $1';
                const result = await db.query(query, [item.medicamento_id]);

                if (result.rows.length === 0) {
                    stockInsuficiente.push({
                        medicamento_id: item.medicamento_id,
                        error: 'Medicamento no encontrado'
                    });
                } else {
                    const medicamento = result.rows[0];
                    if (medicamento.stock < item.cantidad) {
                        stockInsuficiente.push({
                            medicamento_id: item.medicamento_id,
                            nombre: medicamento.nombre,
                            stock_disponible: medicamento.stock,
                            cantidad_solicitada: item.cantidad,
                            error: 'Stock insuficiente'
                        });
                    }
                }
            }

            return {
                disponible: stockInsuficiente.length === 0,
                errores: stockInsuficiente
            };

        } catch (error) {
            console.error('Error al verificar stock:', error);
            throw error;
        }
    }
}

module.exports = VentaModel;
