const db = require('./db');
const bcrypt = require('bcrypt');

class UsuarioModel {
    // Buscar usuario por username
    static async findByUsername(username) {
        try {
            const query = 'SELECT * FROM usuarios WHERE username = $1';
            const result = await db.query(query, [username]);
            return result.rows[0];
        } catch (error) {
            console.error('Error al buscar usuario por username:', error);
            throw error;
        }
    }

    // Validar contraseña
    static async validatePassword(plainPassword, hashedPassword) {
        try {
            // Si la contraseña en la BD no está hasheada (texto plano)
            // comparamos directamente
            if (!hashedPassword.startsWith('$2b$')) {
                return plainPassword === hashedPassword;
            }
            // Si está hasheada, usamos bcrypt
            return await bcrypt.compare(plainPassword, hashedPassword);
        } catch (error) {
            console.error('Error al validar contraseña:', error);
            return false;
        }
    }

    // Crear hash de contraseña (para futuro uso)
    static async hashPassword(plainPassword) {
        try {
            const saltRounds = 10;
            return await bcrypt.hash(plainPassword, saltRounds);
        } catch (error) {
            console.error('Error al hashear contraseña:', error);
            throw error;
        }
    }
}

module.exports = UsuarioModel;
