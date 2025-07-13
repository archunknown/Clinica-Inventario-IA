const UsuarioModel = require('../models/usuarioModel');

class ConfigController {
    // Obtener datos del usuario actual
    static async obtenerPerfil(req, res) {
        try {
            // Por ahora simulamos que el usuario está en sesión
            // En una implementación real, obtendrías el ID del usuario de la sesión
            const userId = 1; // Simulado
            
            const usuario = await UsuarioModel.findById(userId);
            
            if (!usuario) {
                return res.status(404).json({
                    success: false,
                    message: 'Usuario no encontrado'
                });
            }

            // No enviamos la contraseña por seguridad
            const { password, ...usuarioSinPassword } = usuario;
            
            res.json({
                success: true,
                data: usuarioSinPassword
            });
        } catch (error) {
            console.error('Error al obtener perfil:', error);
            res.status(500).json({
                success: false,
                message: 'Error interno del servidor'
            });
        }
    }

    // Actualizar contraseña
    static async actualizarPassword(req, res) {
        try {
            const { passwordActual, passwordNueva, confirmarPassword } = req.body;

            // Validaciones básicas
            if (!passwordActual || !passwordNueva || !confirmarPassword) {
                return res.status(400).json({
                    success: false,
                    message: 'Todos los campos son obligatorios'
                });
            }

            if (passwordNueva !== confirmarPassword) {
                return res.status(400).json({
                    success: false,
                    message: 'Las contraseñas nuevas no coinciden'
                });
            }

            if (passwordNueva.length < 4) {
                return res.status(400).json({
                    success: false,
                    message: 'La contraseña debe tener al menos 4 caracteres'
                });
            }

            // Por ahora simulamos que el usuario está en sesión
            const userId = 1; // Simulado
            
            const usuario = await UsuarioModel.findById(userId);
            
            if (!usuario) {
                return res.status(404).json({
                    success: false,
                    message: 'Usuario no encontrado'
                });
            }

            // Verificar contraseña actual
            const passwordValida = await UsuarioModel.validatePassword(passwordActual, usuario.password);
            
            if (!passwordValida) {
                return res.status(400).json({
                    success: false,
                    message: 'La contraseña actual es incorrecta'
                });
            }

            // Actualizar contraseña
            const resultado = await UsuarioModel.updatePassword(userId, passwordNueva);
            
            if (resultado) {
                res.json({
                    success: true,
                    message: 'Contraseña actualizada correctamente'
                });
            } else {
                res.status(500).json({
                    success: false,
                    message: 'Error al actualizar la contraseña'
                });
            }
        } catch (error) {
            console.error('Error al actualizar contraseña:', error);
            res.status(500).json({
                success: false,
                message: 'Error interno del servidor'
            });
        }
    }

    // Actualizar datos del perfil
    static async actualizarPerfil(req, res) {
        try {
            const { username, rol } = req.body;

            // Validaciones básicas
            if (!username) {
                return res.status(400).json({
                    success: false,
                    message: 'El nombre de usuario es obligatorio'
                });
            }

            // Por ahora simulamos que el usuario está en sesión
            const userId = 1; // Simulado
            
            const resultado = await UsuarioModel.updateProfile(userId, { username, rol });
            
            if (resultado) {
                res.json({
                    success: true,
                    message: 'Perfil actualizado correctamente'
                });
            } else {
                res.status(500).json({
                    success: false,
                    message: 'Error al actualizar el perfil'
                });
            }
        } catch (error) {
            console.error('Error al actualizar perfil:', error);
            res.status(500).json({
                success: false,
                message: 'Error interno del servidor'
            });
        }
    }
}

module.exports = ConfigController;
