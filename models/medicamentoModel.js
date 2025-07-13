const db = require('./db');

class MedicamentoModel {
    // Obtener todos los medicamentos activos
    static async getAll() {
        try {
            // Como ya tienes la columna 'activo' en la BD, filtramos solo los activos
            const query = 'SELECT * FROM medicamentos WHERE activo = true ORDER BY nombre ASC';
            const result = await db.query(query);
            return result.rows;
        } catch (error) {
            console.error('Error al obtener medicamentos:', error);
            throw error;
        }
    }

    // Obtener medicamento por ID
    static async getById(id) {
        try {
            const query = 'SELECT * FROM medicamentos WHERE id = $1';
            const result = await db.query(query, [id]);
            return result.rows[0];
        } catch (error) {
            console.error('Error al obtener medicamento por ID:', error);
            throw error;
        }
    }

    // Obtener medicamento por nombre
    static async getByName(nombre) {
        try {
            const query = 'SELECT * FROM medicamentos WHERE LOWER(nombre) = LOWER($1)';
            const result = await db.query(query, [nombre]);
            return result.rows[0];
        } catch (error) {
            console.error('Error al obtener medicamento por nombre:', error);
            throw error;
        }
    }

    // Crear nuevo medicamento
    static async create(medicamentoData) {
        try {
            const { nombre, categoria, stock, precio, descripcion, unidad } = medicamentoData;
            
            const query = `
                INSERT INTO medicamentos (nombre, categoria, stock, precio, descripcion, unidad)
                VALUES ($1, $2, $3, $4, $5, $6)
                RETURNING *
            `;
            
            const values = [nombre, categoria, stock, precio, descripcion || null, unidad || 'unidades'];
            const result = await db.query(query, values);
            return result.rows[0];
        } catch (error) {
            console.error('Error al crear medicamento:', error);
            throw error;
        }
    }

    // Actualizar medicamento
    static async update(id, medicamentoData) {
        try {
            const { nombre, categoria, stock, precio, descripcion, unidad } = medicamentoData;
            
            const query = `
                UPDATE medicamentos 
                SET nombre = $1, categoria = $2, stock = $3, precio = $4, 
                    descripcion = $5, unidad = $6
                WHERE id = $7
                RETURNING *
            `;
            
            const values = [nombre, categoria, stock, precio, descripcion || null, unidad || 'unidades', id];
            const result = await db.query(query, values);
            return result.rows[0];
        } catch (error) {
            console.error('Error al actualizar medicamento:', error);
            throw error;
        }
    }

    // Verificar si el medicamento tiene ventas asociadas
    static async tieneVentas(id) {
        try {
            const query = 'SELECT COUNT(*) as count FROM detalle_venta WHERE medicamento_id = $1';
            const result = await db.query(query, [id]);
            return parseInt(result.rows[0].count) > 0;
        } catch (error) {
            console.error('Error al verificar ventas del medicamento:', error);
            throw error;
        }
    }

    // Eliminar medicamento (físico)
    static async delete(id) {
        try {
            const query = 'DELETE FROM medicamentos WHERE id = $1 RETURNING *';
            const result = await db.query(query, [id]);
            return result.rows[0];
        } catch (error) {
            console.error('Error al eliminar medicamento:', error);
            throw error;
        }
    }

    // Marcar medicamento como inactivo (eliminación lógica)
    static async marcarInactivo(id) {
        try {
            // Primero verificamos si la columna 'activo' existe, si no, la agregamos
            const checkColumn = `
                SELECT column_name 
                FROM information_schema.columns 
                WHERE table_name='medicamentos' AND column_name='activo'
            `;
            const columnExists = await db.query(checkColumn);
            
            if (columnExists.rows.length === 0) {
                // Agregar columna 'activo' si no existe
                await db.query('ALTER TABLE medicamentos ADD COLUMN activo BOOLEAN DEFAULT true');
            }
            
            // Marcar como inactivo
            const query = 'UPDATE medicamentos SET activo = false WHERE id = $1 RETURNING *';
            const result = await db.query(query, [id]);
            return result.rows[0];
        } catch (error) {
            console.error('Error al marcar medicamento como inactivo:', error);
            throw error;
        }
    }

    // Actualizar solo el stock
    static async updateStock(id, nuevoStock) {
        try {
            const query = `
                UPDATE medicamentos 
                SET stock = $1
                WHERE id = $2
                RETURNING *
            `;
            const result = await db.query(query, [nuevoStock, id]);
            return result.rows[0];
        } catch (error) {
            console.error('Error al actualizar stock:', error);
            throw error;
        }
    }

    // Buscar medicamentos por nombre o categoría
    static async search(searchTerm) {
        try {
            const query = `
                SELECT * FROM medicamentos 
                WHERE LOWER(nombre) LIKE LOWER($1) 
                OR LOWER(categoria) LIKE LOWER($1)
                OR LOWER(descripcion) LIKE LOWER($1)
                ORDER BY nombre ASC
            `;
            const result = await db.query(query, [`%${searchTerm}%`]);
            return result.rows;
        } catch (error) {
            console.error('Error al buscar medicamentos:', error);
            throw error;
        }
    }

    // Obtener medicamentos con stock bajo
    static async getLowStock(limite = 20) {
        try {
            const query = 'SELECT * FROM medicamentos WHERE stock < $1 ORDER BY stock ASC';
            const result = await db.query(query, [limite]);
            return result.rows;
        } catch (error) {
            console.error('Error al obtener medicamentos con stock bajo:', error);
            throw error;
        }
    }

    // Obtener medicamentos por categoría
    static async getByCategory(categoria) {
        try {
            const query = 'SELECT * FROM medicamentos WHERE categoria = $1 ORDER BY nombre ASC';
            const result = await db.query(query, [categoria]);
            return result.rows;
        } catch (error) {
            console.error('Error al obtener medicamentos por categoría:', error);
            throw error;
        }
    }

    // Obtener todas las categorías únicas
    static async getCategories() {
        try {
            const query = 'SELECT DISTINCT categoria FROM medicamentos ORDER BY categoria ASC';
            const result = await db.query(query);
            return result.rows.map(row => row.categoria);
        } catch (error) {
            console.error('Error al obtener categorías:', error);
            throw error;
        }
    }

    // Obtener medicamentos próximos a vencer (no disponible en esta estructura)
    static async getExpiringMedicamentos(dias = 30) {
        try {
            // Como no hay campo fecha_vencimiento, devolvemos array vacío
            return [];
        } catch (error) {
            console.error('Error al obtener medicamentos próximos a vencer:', error);
            throw error;
        }
    }

    // Obtener estadísticas del inventario
    static async getStats() {
        try {
            const query = `
                SELECT 
                    COUNT(*) as total_productos,
                    SUM(stock) as total_unidades,
                    SUM(stock * precio) as valor_total,
                    COUNT(CASE WHEN stock < 20 THEN 1 END) as productos_stock_bajo,
                    AVG(precio) as precio_promedio
                FROM medicamentos
            `;
            const result = await db.query(query);
            return result.rows[0];
        } catch (error) {
            console.error('Error al obtener estadísticas:', error);
            throw error;
        }
    }

    // Obtener medicamentos más vendidos
    static async getTopSelling(limite = 10) {
        try {
            const query = `
                SELECT m.*, COALESCE(SUM(dv.cantidad), 0) as total_vendido
                FROM medicamentos m
                LEFT JOIN detalle_venta dv ON m.id = dv.medicamento_id
                GROUP BY m.id
                ORDER BY total_vendido DESC
                LIMIT $1
            `;
            const result = await db.query(query, [limite]);
            return result.rows;
        } catch (error) {
            console.error('Error al obtener medicamentos más vendidos:', error);
            return [];
        }
    }

    // Verificar si existe la tabla de medicamentos
    static async checkTableExists() {
        try {
            const query = `
                SELECT EXISTS (
                    SELECT FROM information_schema.tables 
                    WHERE table_schema = 'public' 
                    AND table_name = 'medicamentos'
                );
            `;
            const result = await db.query(query);
            return result.rows[0].exists;
        } catch (error) {
            console.error('Error al verificar tabla medicamentos:', error);
            return false;
        }
    }

    // Crear tabla de medicamentos si no existe (usando estructura existente)
    static async createTable() {
        try {
            const query = `
                CREATE TABLE IF NOT EXISTS medicamentos (
                    id SERIAL PRIMARY KEY,
                    nombre TEXT NOT NULL,
                    categoria TEXT,
                    descripcion TEXT,
                    stock INTEGER NOT NULL,
                    precio DECIMAL(10,2) NOT NULL,
                    unidad TEXT
                );
                
                CREATE INDEX IF NOT EXISTS idx_medicamentos_nombre ON medicamentos(nombre);
                CREATE INDEX IF NOT EXISTS idx_medicamentos_categoria ON medicamentos(categoria);
                CREATE INDEX IF NOT EXISTS idx_medicamentos_stock ON medicamentos(stock);
            `;
            await db.query(query);
            console.log('✅ Tabla medicamentos verificada correctamente');
        } catch (error) {
            console.error('Error al verificar tabla medicamentos:', error);
            throw error;
        }
    }
}

module.exports = MedicamentoModel;
