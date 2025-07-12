const UsuarioModel = require('../models/usuarioModel');

class AuthController {
    // Login de usuario
    static async login(req, res) {
        try {
            const { username, password } = req.body;

            // Validar que se recibieron los datos
            if (!username || !password) {
                return res.status(400).json({
                    success: false,
                    message: 'Usuario y contraseña son requeridos'
                });
            }

            // Buscar usuario por username
            const usuario = await UsuarioModel.findByUsername(username);

            // Verificar si el usuario existe
            if (!usuario) {
                return res.status(401).json({
                    success: false,
                    message: 'Credenciales inválidas'
                });
            }

            // Validar contraseña
            const isValidPassword = await UsuarioModel.validatePassword(password, usuario.password);

            if (!isValidPassword) {
                return res.status(401).json({
                    success: false,
                    message: 'Credenciales inválidas'
                });
            }

            // Login exitoso
            // Por ahora no implementamos JWT, solo devolvemos éxito
            res.json({
                success: true,
                message: 'Login exitoso',
                user: {
                    id: usuario.id,
                    username: usuario.username,
                    rol: usuario.rol || 'usuario'
                }
            });

        } catch (error) {
            console.error('Error en login:', error);
            res.status(500).json({
                success: false,
                message: 'Error al procesar el login'
            });
        }
    }

    // Logout (por implementar con sesiones/JWT)
    static async logout(req, res) {
        res.json({
            success: true,
            message: 'Logout exitoso'
        });
    }
}

module.exports = AuthController;
