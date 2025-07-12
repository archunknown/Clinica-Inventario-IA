const db = require('./db');

class MedicamentoModel {
    // Obtener todos los medicamentos
    static async getAll() {
        try {
            const query = 'SELECT * FROM medicamentos ORDER BY nombre ASC';
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

    // Buscar medicamentos por nombre o categoría
    static async search(searchTerm) {
        try {
            const query = `
                SELECT * FROM medicamentos 
                WHERE LOWER(nombre) LIKE LOWER($1) 
                OR LOWER(categoria) LIKE LOWER($1)
                ORDER BY nombre ASC
            `;
            const result = await db.query(query, [`%${searchTerm}%`]);
            return result.rows;
        } catch (error) {
            console.error('Error al buscar medicamentos:', error);
            throw error;
        }
    }

    // Obtener medicamentos con stock bajo (menos de 20 unidades)
    static async getLowStock() {
        try {
            const query = 'SELECT * FROM medicamentos WHERE stock < 20 ORDER BY stock ASC';
            const result = await db.query(query);
            return result.rows;
        } catch (error) {
            console.error('Error al obtener medicamentos con stock bajo:', error);
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
                    COUNT(CASE WHEN stock < 20 THEN 1 END) as productos_stock_bajo
                FROM medicamentos
            `;
            const result = await db.query(query);
            return result.rows[0];
        } catch (error) {
            console.error('Error al obtener estadísticas:', error);
            throw error;
        }
    }
}

module.exports = MedicamentoModel;
