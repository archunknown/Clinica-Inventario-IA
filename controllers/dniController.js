const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

class DNIController {
    // Consultar datos por DNI usando API externa
    static async consultarDNI(req, res) {
        try {
            const { dni } = req.params;
            
            // Validar formato de DNI
            if (!dni || !/^\d{8}$/.test(dni)) {
                return res.status(400).json({
                    success: false,
                    message: 'DNI debe tener exactamente 8 dígitos numéricos'
                });
            }
            
            // Obtener token desde variables de entorno
            const token = process.env.DNI_API_TOKEN;
            const apiUrl = process.env.DNI_API_URL || 'https://miapi.cloud/v1/dni';
            
            if (!token) {
                console.error('DNI_API_TOKEN no configurado');
                return res.status(500).json({
                    success: false,
                    message: 'Servicio de consulta DNI no disponible'
                });
            }
            
            // Realizar consulta a la API externa
            const response = await fetch(`${apiUrl}/${dni}`, {
                headers: { 
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                timeout: 10000 // 10 segundos de timeout
            });
            
            if (!response.ok) {
                if (response.status === 404) {
                    return res.json({
                        success: false,
                        message: 'DNI no encontrado',
                        data: null
                    });
                }
                
                throw new Error(`API Error: ${response.status}`);
            }
            
            const result = await response.json();
            const datos = result.datos;
            
            if (datos && datos.nombres) {
                // Mapear los datos al formato esperado por el frontend
                const datosFormateados = {
                    nombres: datos.nombres || '',
                    apellido_paterno: datos.ape_paterno || '',
                    apellido_materno: datos.ape_materno || '',
                    // Incluir datos adicionales si están disponibles
                    direccion: datos.direccion || null,
                    ubigeo: datos.ubigeo || null
                };
                
                return res.json({
                    success: true,
                    message: 'Datos encontrados',
                    data: datosFormateados
                });
            } else {
                return res.json({
                    success: false,
                    message: 'DNI no encontrado en la base de datos',
                    data: null
                });
            }
            
        } catch (error) {
            console.error('Error en consultarDNI:', error);
            
            // No exponer detalles del error al frontend por seguridad
            return res.status(500).json({
                success: false,
                message: 'Error interno del servidor al consultar DNI'
            });
        }
    }
}

module.exports = DNIController;
