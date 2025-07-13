const db = require('./db');

class ClienteModel {
    // Crear un nuevo cliente
    static async crear(clienteData) {
        try {
            console.log('Intentando crear cliente con datos:', clienteData); // LOG DE DEPURACIÓN
            
            const query = `
                INSERT INTO clientes (dni, nombre, apellido_paterno, apellido_materno)
                VALUES ($1, $2, $3, $4)
                RETURNING id, dni, nombre, apellido_paterno, apellido_materno
            `;
            
            const values = [
                clienteData.dni || null,
                clienteData.nombre || null,
                clienteData.apellido_paterno || null,
                clienteData.apellido_materno || null
            ];
            
            console.log('Valores a insertar:', values); // LOG DE DEPURACIÓN
            
            const result = await db.query(query, values);
            
            console.log('Cliente creado exitosamente:', result.rows[0]); // LOG DE DEPURACIÓN
            
            return result.rows[0];
        } catch (error) {
            console.error('Error detallado al crear cliente:', {
                message: error.message,
                code: error.code,
                detail: error.detail,
                table: error.table,
                constraint: error.constraint
            });
            throw error;
        }
    }

    // Buscar cliente por DNI
    static async buscarPorDNI(dni) {
        try {
            const query = 'SELECT * FROM clientes WHERE dni = $1';
            const result = await db.query(query, [dni]);
            return result.rows[0] || null;
        } catch (error) {
            console.error('Error al buscar cliente por DNI:', error);
            throw error;
        }
    }

    // Buscar cliente por ID
    static async buscarPorId(id) {
        try {
            const query = 'SELECT * FROM clientes WHERE id = $1';
            const result = await db.query(query, [id]);
            return result.rows[0] || null;
        } catch (error) {
            console.error('Error al buscar cliente por ID:', error);
            throw error;
        }
    }

    // Buscar clientes por nombre (búsqueda parcial)
    static async buscarPorNombre(nombre) {
        try {
            const query = `
                SELECT * FROM clientes 
                WHERE LOWER(nombre) LIKE LOWER($1) 
                   OR LOWER(apellido_paterno) LIKE LOWER($1)
                   OR LOWER(apellido_materno) LIKE LOWER($1)
                   OR LOWER(CONCAT(nombre, ' ', apellido_paterno, ' ', apellido_materno)) LIKE LOWER($1)
                ORDER BY nombre, apellido_paterno
            `;
            const result = await db.query(query, [`%${nombre}%`]);
            return result.rows;
        } catch (error) {
            console.error('Error al buscar clientes por nombre:', error);
            throw error;
        }
    }

    // Obtener todos los clientes
    static async obtenerTodos(limit = 100, offset = 0) {
        try {
            const query = `
                SELECT * FROM clientes 
                ORDER BY nombre, apellido_paterno 
                LIMIT $1 OFFSET $2
            `;
            const result = await db.query(query, [limit, offset]);
            return result.rows;
        } catch (error) {
            console.error('Error al obtener clientes:', error);
            throw error;
        }
    }

    // Actualizar cliente
    static async actualizar(id, clienteData) {
        try {
            const query = `
                UPDATE clientes 
                SET dni = $2, nombre = $3, apellido_paterno = $4, apellido_materno = $5
                WHERE id = $1
                RETURNING id, dni, nombre, apellido_paterno, apellido_materno
            `;
            
            const result = await db.query(query, [
                id,
                clienteData.dni,
                clienteData.nombre,
                clienteData.apellido_paterno,
                clienteData.apellido_materno
            ]);

            return result.rows[0] || null;
        } catch (error) {
            console.error('Error al actualizar cliente:', error);
            throw error;
        }
    }

    // Eliminar cliente
    static async eliminar(id) {
        try {
            const query = 'DELETE FROM clientes WHERE id = $1 RETURNING *';
            const result = await db.query(query, [id]);
            return result.rows[0] || null;
        } catch (error) {
            console.error('Error al eliminar cliente:', error);
            throw error;
        }
    }

    // Verificar si existe un cliente con el DNI dado
    static async existeDNI(dni, excludeId = null) {
        try {
            let query = 'SELECT id FROM clientes WHERE dni = $1';
            let params = [dni];

            if (excludeId) {
                query += ' AND id != $2';
                params.push(excludeId);
            }

            const result = await db.query(query, params);
            return result.rows.length > 0;
        } catch (error) {
            console.error('Error al verificar DNI:', error);
            throw error;
        }
    }

    // Obtener historial de compras de un cliente
    static async obtenerHistorialCompras(clienteId) {
        try {
            const query = `
                SELECT v.*, 
                       COUNT(dv.id) as total_items,
                       ARRAY_AGG(
                           JSON_BUILD_OBJECT(
                               'medicamento', m.nombre,
                               'cantidad', dv.cantidad,
                               'subtotal', dv.subtotal
                           )
                       ) as items
                FROM ventas v
                LEFT JOIN detalle_venta dv ON v.id = dv.venta_id
                LEFT JOIN medicamentos m ON dv.medicamento_id = m.id
                WHERE v.cliente_id = $1
                GROUP BY v.id
                ORDER BY v.fecha DESC
            `;
            const result = await db.query(query, [clienteId]);
            return result.rows;
        } catch (error) {
            console.error('Error al obtener historial de compras:', error);
            throw error;
        }
    }
}

module.exports = ClienteModel;
