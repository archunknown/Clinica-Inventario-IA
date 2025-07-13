const db = require('../models/db');

class DashboardController {
    // Obtener estadísticas generales del dashboard
    static async getStats(req, res) {
        try {
            // Obtener total de productos activos
            const totalProductosQuery = `
                SELECT COUNT(*) as total 
                FROM medicamentos 
                WHERE activo = true
            `;
            const totalProductosResult = await db.query(totalProductosQuery);
            const totalProductos = parseInt(totalProductosResult.rows[0].total);

            // Obtener total de unidades en stock
            const totalUnidadesQuery = `
                SELECT COALESCE(SUM(stock), 0) as total 
                FROM medicamentos 
                WHERE activo = true
            `;
            const totalUnidadesResult = await db.query(totalUnidadesQuery);
            const totalUnidades = parseInt(totalUnidadesResult.rows[0].total);

            // Obtener valor total del inventario
            const valorTotalQuery = `
                SELECT COALESCE(SUM(stock * precio), 0) as total 
                FROM medicamentos 
                WHERE activo = true
            `;
            const valorTotalResult = await db.query(valorTotalQuery);
            const valorTotal = parseFloat(valorTotalResult.rows[0].total);

            // Obtener productos con stock bajo (menos de 20)
            const stockBajoQuery = `
                SELECT COUNT(*) as total 
                FROM medicamentos 
                WHERE activo = true AND stock < 20
            `;
            const stockBajoResult = await db.query(stockBajoQuery);
            const stockBajo = parseInt(stockBajoResult.rows[0].total);

            // Obtener ventas de hoy
            const ventasHoyQuery = `
                SELECT 
                    COALESCE(COUNT(DISTINCT v.id), 0) as num_ventas_hoy,
                    COALESCE(SUM(v.total), 0) as total_ventas_hoy,
                    COALESCE(SUM(dv.cantidad), 0) as productos_vendidos_hoy
                FROM ventas v
                LEFT JOIN detalle_venta dv ON v.id = dv.venta_id
                WHERE DATE(v.fecha) = CURRENT_DATE
            `;
            const ventasHoyResult = await db.query(ventasHoyQuery);
            const numVentasHoy = parseInt(ventasHoyResult.rows[0].num_ventas_hoy);
            const totalVentasHoy = parseFloat(ventasHoyResult.rows[0].total_ventas_hoy);
            const productosVendidosHoy = parseInt(ventasHoyResult.rows[0].productos_vendidos_hoy);

            // Obtener ventas del mes actual
            const ventasMesQuery = `
                SELECT 
                    COALESCE(COUNT(DISTINCT v.id), 0) as num_ventas_mes,
                    COALESCE(SUM(v.total), 0) as total_ventas_mes
                FROM ventas v
                WHERE EXTRACT(MONTH FROM v.fecha) = EXTRACT(MONTH FROM CURRENT_DATE)
                  AND EXTRACT(YEAR FROM v.fecha) = EXTRACT(YEAR FROM CURRENT_DATE)
            `;
            const ventasMesResult = await db.query(ventasMesQuery);
            const numVentasMes = parseInt(ventasMesResult.rows[0].num_ventas_mes);
            const totalVentasMes = parseFloat(ventasMesResult.rows[0].total_ventas_mes);

            // Obtener ventas del mes anterior para comparación
            const ventasMesAnteriorQuery = `
                SELECT COALESCE(SUM(total), 0) as total_ventas
                FROM ventas 
                WHERE EXTRACT(MONTH FROM fecha) = EXTRACT(MONTH FROM CURRENT_DATE - INTERVAL '1 month')
                  AND EXTRACT(YEAR FROM fecha) = EXTRACT(YEAR FROM CURRENT_DATE - INTERVAL '1 month')
            `;
            const ventasMesAnteriorResult = await db.query(ventasMesAnteriorQuery);
            const ventasMesAnterior = parseFloat(ventasMesAnteriorResult.rows[0].total_ventas);

            // Calcular porcentaje de cambio en ventas
            let porcentajeCambioVentas = 0;
            if (ventasMesAnterior > 0) {
                porcentajeCambioVentas = ((totalVentasMes - ventasMesAnterior) / ventasMesAnterior * 100).toFixed(1);
            } else if (totalVentasMes > 0) {
                porcentajeCambioVentas = 100; // Si no había ventas el mes anterior pero sí este mes
            }

            res.json({
                success: true,
                data: {
                    totalProductos,
                    totalUnidades,
                    valorTotal,
                    stockBajo,
                    numVentasHoy,
                    totalVentasHoy,
                    productosVendidosHoy,
                    numVentasMes,
                    totalVentasMes,
                    porcentajeCambioVentas
                }
            });

        } catch (error) {
            console.error('Error al obtener estadísticas del dashboard:', error);
            res.status(500).json({
                success: false,
                message: 'Error al obtener estadísticas del dashboard'
            });
        }
    }

    // Obtener productos más vendidos
    static async getTopProductos(req, res) {
        try {
            const query = `
                SELECT 
                    m.nombre,
                    m.categoria,
                    COALESCE(SUM(dv.cantidad), 0) as total_vendido,
                    COALESCE(SUM(dv.subtotal), 0) as total_ingresos
                FROM medicamentos m
                LEFT JOIN detalle_venta dv ON m.id = dv.medicamento_id
                LEFT JOIN ventas v ON dv.venta_id = v.id
                WHERE m.activo = true
                  AND (v.fecha IS NULL OR v.fecha >= CURRENT_DATE - INTERVAL '30 days')
                GROUP BY m.id, m.nombre, m.categoria
                ORDER BY total_vendido DESC
                LIMIT 10
            `;

            const result = await db.query(query);

            res.json({
                success: true,
                data: result.rows
            });

        } catch (error) {
            console.error('Error al obtener productos más vendidos:', error);
            res.status(500).json({
                success: false,
                message: 'Error al obtener productos más vendidos'
            });
        }
    }

    // Obtener actividad reciente
    static async getActividadReciente(req, res) {
        try {
            const query = `
                SELECT 
                    'venta' as tipo,
                    v.id,
                    v.fecha,
                    v.total,
                    c.nombre as cliente_nombre,
                    c.apellido_paterno,
                    COUNT(dv.id) as items
                FROM ventas v
                LEFT JOIN clientes c ON v.cliente_id = c.id
                LEFT JOIN detalle_venta dv ON v.id = dv.venta_id
                GROUP BY v.id, v.fecha, v.total, c.nombre, c.apellido_paterno
                ORDER BY v.fecha DESC
                LIMIT 10
            `;

            const result = await db.query(query);

            // Formatear los datos para el frontend
            const actividades = result.rows.map(row => ({
                tipo: row.tipo,
                titulo: `Nueva venta registrada`,
                descripcion: row.cliente_nombre ? 
                    `Cliente: ${row.cliente_nombre} ${row.apellido_paterno || ''}` : 
                    'Venta sin cliente registrado',
                fecha: row.fecha,
                valor: `S/ ${parseFloat(row.total).toFixed(2)}`,
                items: `${row.items} productos`
            }));

            res.json({
                success: true,
                data: actividades
            });

        } catch (error) {
            console.error('Error al obtener actividad reciente:', error);
            res.status(500).json({
                success: false,
                message: 'Error al obtener actividad reciente'
            });
        }
    }

    // Obtener productos con stock bajo
    static async getStockBajo(req, res) {
        try {
            const query = `
                SELECT 
                    id,
                    nombre,
                    categoria,
                    stock,
                    precio,
                    unidad
                FROM medicamentos 
                WHERE activo = true AND stock < 20
                ORDER BY stock ASC, nombre ASC
            `;

            const result = await db.query(query);

            res.json({
                success: true,
                data: result.rows
            });

        } catch (error) {
            console.error('Error al obtener productos con stock bajo:', error);
            res.status(500).json({
                success: false,
                message: 'Error al obtener productos con stock bajo'
            });
        }
    }

    // Obtener datos para gráfico de ventas mensuales
    static async getVentasMensuales(req, res) {
        try {
            const query = `
                SELECT 
                    TO_CHAR(fecha, 'YYYY-MM') as mes,
                    COALESCE(SUM(total), 0) as total_ventas,
                    COUNT(*) as num_ventas
                FROM ventas 
                WHERE fecha >= CURRENT_DATE - INTERVAL '6 months'
                GROUP BY TO_CHAR(fecha, 'YYYY-MM')
                ORDER BY mes ASC
            `;

            const result = await db.query(query);

            res.json({
                success: true,
                data: result.rows
            });

        } catch (error) {
            console.error('Error al obtener ventas mensuales:', error);
            res.status(500).json({
                success: false,
                message: 'Error al obtener ventas mensuales'
            });
        }
    }
}

module.exports = DashboardController;
