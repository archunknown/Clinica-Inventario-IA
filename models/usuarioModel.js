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

    // Buscar usuario por ID
    static async findById(id) {
        try {
            const query = 'SELECT * FROM usuarios WHERE id = $1';
            const result = await db.query(query, [id]);
            return result.rows[0];
        } catch (error) {
            console.error('Error al buscar usuario por ID:', error);
            throw error;
        }
    }

    // Actualizar contraseña
    static async updatePassword(userId, newPassword) {
        try {
            // Por simplicidad, guardamos la contraseña en texto plano
            // En producción deberías hashearla
            const query = 'UPDATE usuarios SET password = $1 WHERE id = $2';
            const result = await db.query(query, [newPassword, userId]);
            return result.rowCount > 0;
        } catch (error) {
            console.error('Error al actualizar contraseña:', error);
            throw error;
        }
    }

    // Actualizar perfil de usuario
    static async updateProfile(userId, userData) {
        try {
            const { username, rol } = userData;
            const query = 'UPDATE usuarios SET username = $1, rol = $2 WHERE id = $3';
            const result = await db.query(query, [username, rol, userId]);
            return result.rowCount > 0;
        } catch (error) {
            console.error('Error al actualizar perfil:', error);
            throw error;
        }
    }
}

module.exports = UsuarioModel;
