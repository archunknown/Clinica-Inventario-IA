const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));
const db = require('../models/db');
const WeatherService = require('./weatherService');

class IAInventarioService {
    // Obtener el contexto del inventario desde la vista de PostgreSQL
    static async obtenerContextoInventario() {
        try {
            const query = 'SELECT * FROM vista_inventario_util ORDER BY nombre';
            const result = await db.query(query);
            return result.rows;
        } catch (error) {
            console.error('Error al obtener inventario para IA:', error);
            throw error;
        }
    }

    // Procesar consulta con IA
    static async procesarConsulta(pregunta) {
        try {
            // Obtener datos actuales del inventario, clientes y ventas
            const contexto = await this.obtenerContextoCompleto();
            
            // Crear contexto expandido para la IA
            const context = `
Eres un asistente médico inteligente de una clínica. Tu tarea es responder de manera natural, profesional y clara preguntas sobre el inventario de medicamentos, clientes y ventas, siempre dirigiendote a tu creador y desarrollador Arch Adrián en cada consulta.

INVENTARIO ACTUAL DE MEDICAMENTOS:
${JSON.stringify(contexto.inventario, null, 2)}

CLIENTES REGISTRADOS:
${JSON.stringify(contexto.clientes, null, 2)}

HISTORIAL DE VENTAS RECIENTES:
${JSON.stringify(contexto.ventas, null, 2)}

INSTRUCCIONES:
1. Responde de forma natural y conversacional, siempre dirigiendote a tu creador y desarrollador Arch Adrián en cada consulta
2. Si el usuario escribe con errores ortográficos o de forma informal, igual debes entenderlo
3. Proporciona información útil sobre medicamentos, clientes y ventas
4. Si preguntan por algo que no está disponible, indícalo claramente
5. Cuando menciones cantidades, usa las unidades apropiadas
6. Si es relevante, menciona la categoría del medicamento
7. Para consultas de ventas, puedes proporcionar estadísticas y análisis
8. Para consultas de clientes, puedes buscar por DNI o nombre
9. Sé conciso pero completo en tus respuestas
10. Mantén la confidencialidad de los datos sensibles

EJEMPLOS DE RESPUESTAS:
- "Sí, tenemos Amoxicilina disponible. Actualmente contamos con 30 cápsulas en stock."
- "Para la gripe, tenemos disponibles: Paracetamol (50 tabletas) y otros analgésicos que pueden ayudar con los síntomas."
- "El cliente con DNI 12345678 es Juan Pérez García y ha realizado 3 compras este mes."
- "En las últimas ventas, el medicamento más vendido ha sido Paracetamol con 15 unidades."
- "Lo siento, no tenemos ese medicamento en nuestro inventario actual."

TIPOS DE CONSULTAS QUE PUEDES RESPONDER:
- Disponibilidad de medicamentos
- Información sobre stock y precios
- Búsqueda de clientes por DNI o nombre
- Estadísticas de ventas
- Medicamentos más vendidos
- Historial de compras de clientes
- Recomendaciones por síntomas
- Análisis de inventario
`;

            // Llamar a OpenRouter API
            const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
                method: "POST",
                headers: {
                    "Authorization": `Bearer ${process.env.OPENROUTER_API_KEY}`,
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    model: "deepseek/deepseek-r1:free",
                    messages: [
                        { role: "system", content: context },
                        { role: "user", content: pregunta }
                    ],
                    temperature: 0.7,
                    max_tokens: 500
                })
            });

            const data = await response.json();

            if (data.error) {
                // Manejar rate limit específicamente
                if (data.error.code === 429) {
                    return {
                        success: false,
                        error: 'Rate limit alcanzado. Por favor, intenta nuevamente en unos minutos.',
                        respuesta: "Lo siento, he alcanzado el límite de consultas por ahora. Por favor, intenta nuevamente en unos minutos."
                    };
                }
                throw new Error(data.error.message || 'Error en la API de IA');
            }

            const respuesta = data.choices?.[0]?.message?.content ||
                            data.choices?.[0]?.text ||
                            "No se pudo generar una respuesta.";

            return {
                success: true,
                respuesta: respuesta,
                timestamp: new Date().toISOString()
            };

        } catch (error) {
            console.error('Error en servicio IA:', error);
            return {
                success: false,
                error: error.message,
                respuesta: "Lo siento, hubo un error al procesar tu consulta. Por favor, intenta nuevamente."
            };
        }
    }

    // Obtener sugerencias basadas en síntomas
    static async obtenerSugerencias(sintomas) {
        const pregunta = `¿Qué medicamentos del inventario podrían ser útiles para estos síntomas: ${sintomas}?`;
        return await this.procesarConsulta(pregunta);
    }

    // Verificar disponibilidad de medicamento
    static async verificarDisponibilidad(medicamento) {
        const pregunta = `¿Hay ${medicamento} disponible en el inventario? ¿Cuántas unidades?`;
        return await this.procesarConsulta(pregunta);
    }

    // Obtener contexto de clientes desde la vista de PostgreSQL
    static async obtenerContextoClientes() {
        try {
            const query = 'SELECT * FROM vista_clientes_util ORDER BY nombre_completo';
            const result = await db.query(query);
            return result.rows;
        } catch (error) {
            console.error('Error al obtener clientes para IA:', error);
            throw error;
        }
    }

    // Obtener contexto de ventas desde la vista de PostgreSQL
    static async obtenerContextoVentas(limite = 50) {
        try {
            const query = 'SELECT * FROM vista_ventas_util LIMIT $1';
            const result = await db.query(query, [limite]);
            return result.rows;
        } catch (error) {
            console.error('Error al obtener ventas para IA:', error);
            throw error;
        }
    }

    // Obtener contexto completo para la IA
    static async obtenerContextoCompleto() {
        try {
            const [inventario, clientes, ventas] = await Promise.all([
                this.obtenerContextoInventario(),
                this.obtenerContextoClientes(),
                this.obtenerContextoVentas()
            ]);

            return {
                inventario,
                clientes,
                ventas
            };
        } catch (error) {
            console.error('Error al obtener contexto completo para IA:', error);
            throw error;
        }
    }

    // Buscar cliente por DNI o nombre
    static async buscarCliente(busqueda) {
        const pregunta = `Busca información del cliente: ${busqueda}. Puede ser por DNI o nombre.`;
        return await this.procesarConsulta(pregunta);
    }

    // Obtener estadísticas de ventas
    static async obtenerEstadisticasVentas() {
        const pregunta = "Dame un resumen de las estadísticas de ventas recientes, incluyendo medicamentos más vendidos y tendencias.";
        return await this.procesarConsulta(pregunta);
    }

    // Analizar inventario
    static async analizarInventario() {
        const pregunta = "Analiza el estado actual del inventario: productos con stock bajo, categorías más representadas, y recomendaciones.";
        return await this.procesarConsulta(pregunta);
    }

    // Obtener recomendaciones basadas en el clima
    static async obtenerRecomendacionesClima() {
        try {
            console.log('OPENROUTER_API_KEY configurada:', process.env.OPENROUTER_API_KEY ? 'Sí' : 'No');

            // Obtener datos del clima actual
            const clima = await WeatherService.obtenerClimaActual();

            // COMENTADO: Llamadas a OpenRouter para forzar fallback y evitar uso de API
            /*
            // Obtener contexto del inventario
            const contextoInventario = await this.obtenerContextoInventario();

            // Crear contexto específico para recomendaciones climáticas (versión optimizada para reducir tokens)
            const inventarioResumido = contextoInventario.map(item => `- ${item.nombre} (${item.categoria}, stock: ${item.stock})`).join('\n');
            const context = `
Eres un asistente inteligente de una clínica farmacéutica. Genera recomendaciones de productos basadas en el clima actual.

CLIMA ACTUAL:
- Ciudad: ${clima.ciudad}, ${clima.pais}
- Temperatura: ${clima.temperatura}°C
- Condición: ${clima.descripcion}
- Humedad: ${clima.humedad}%

INVENTARIO DISPONIBLE (solo nombres y categorías relevantes):
${inventarioResumido}

INSTRUCCIONES:
1. Sugiere 3-5 productos del inventario según el clima:
   - Frío (<15°C): Analgésicos (Paracetamol, Ibuprofeno), Vitaminas C, Jarabe para la Tos
   - Calor (>25°C): Protector Solar, Electrolitos, Vitaminas
   - Lluvia/Humedad alta (>70%): Antihistamínicos (Loratadina, Cetirizina)
   - Normal (15-25°C): Analgésicos básicos, Vitaminas generales
2. Solo usa productos del inventario listado.
3. Responde SOLO con una lista numerada de nombres de productos, e.g.:
1. Paracetamol
2. Vitamina C
3. Jarabe para la Tos
No agregues explicaciones ni texto extra.
`;

            // Llamar a OpenRouter API
            console.log('Enviando consulta a OpenRouter...');
            const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
                method: "POST",
                headers: {
                    "Authorization": `Bearer ${process.env.OPENROUTER_API_KEY}`,
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    model: "deepseek/deepseek-r1:free",
                    messages: [
                        { role: "system", content: context },
                        { role: "user", content: `Genera recomendaciones de productos para las condiciones climáticas actuales: ${clima.temperatura}°C, ${clima.descripcion}, humedad ${clima.humedad}%.` }
                    ],
                    temperature: 0.7,
                    max_tokens: 800
                })
            });

            console.log('Respuesta de OpenRouter status:', response.status);
            const data = await response.json();
            console.log('Respuesta de OpenRouter:', JSON.stringify(data, null, 2));

            if (data.error) {
                // Si es rate limit u otro error, usar fallback
                console.log('Error en API de IA, usando recomendaciones de fallback:', data.error.message);
                return this.generarRecomendacionesFallback(clima);
            }

            let recomendaciones = data.choices?.[0]?.message?.content ||
                               data.choices?.[0]?.text ||
                               "No se pudieron generar recomendaciones.";

            // Si la respuesta está vacía o truncada, usar fallback
            if (!recomendaciones || recomendaciones.trim().length < 10 || data.choices[0].finish_reason === 'length') {
                console.log('Respuesta IA incompleta o truncada, usando fallback');
                return this.generarRecomendacionesFallback(clima);
            }

            return {
                success: true,
                recomendaciones: recomendaciones,
                clima: {
                    ciudad: clima.ciudad,
                    temperatura: clima.temperatura,
                    descripcion: clima.descripcion,
                    humedad: clima.humedad
                },
                timestamp: new Date().toISOString()
            };
            */

            // Forzar uso de fallback para evitar llamadas a OpenRouter
            console.log('Usando recomendaciones de fallback (OpenRouter deshabilitado)');
            return this.generarRecomendacionesFallback(clima);

        } catch (error) {
            console.error('Error al obtener recomendaciones climáticas:', error);
            return {
                success: false,
                error: error.message,
                recomendaciones: "No se pudieron cargar las recomendaciones climáticas.",
                clima: null
            };
        }
    }

    // Generar recomendaciones de fallback cuando la API falla (versión dinámica con consulta a DB)
    static async generarRecomendacionesFallback(clima) {
        console.log('Generando recomendaciones de fallback dinámicas para clima:', clima);

        let tempNeutral = 18;
        let descNeutral = 'condiciones normales';
        let humNeutral = 60;

        let recomendaciones = [];

        try {
            // Si hay error en clima, usar recomendaciones generales
            if (clima.error) {
                const query = `
                    SELECT nombre FROM medicamentos 
                    WHERE activo = true AND stock > 0 
                    AND (categoria ILIKE '%analg%' OR categoria ILIKE '%vitamina%' OR nombre ILIKE '%paracetamol%' OR nombre ILIKE '%ibuprofeno%')
                    LIMIT 5
                `;
                const result = await db.query(query);
                recomendaciones = result.rows.map(row => row.nombre);
            } else {
                // Lógica dinámica basada en temperatura y clima
                let query = '';
                if (clima.temperatura < 15) {
                    // Frío: Analgésicos, vitaminas C, jarabes
                    query = `
                        SELECT nombre FROM medicamentos 
                        WHERE activo = true AND stock > 0 
                        AND (categoria ILIKE '%analg%' OR categoria ILIKE '%vitamina%' OR nombre ILIKE '%paracetamol%' OR nombre ILIKE '%jarabe%' OR nombre ILIKE '%tos%')
                        ORDER BY stock ASC
                        LIMIT 5
                    `;
                } else if (clima.temperatura > 25) {
                    // Calor: Protector solar, electrolitos, vitaminas
                    query = `
                        SELECT nombre FROM medicamentos 
                        WHERE activo = true AND stock > 0 
                        AND (nombre ILIKE '%protector%' OR nombre ILIKE '%solar%' OR nombre ILIKE '%electrolit%' OR categoria ILIKE '%vitamina%')
                        ORDER BY stock ASC
                        LIMIT 5
                    `;
                } else {
                    // Temperatura normal: Analgésicos básicos, vitaminas, suplementos
                    query = `
                        SELECT nombre FROM medicamentos 
                        WHERE activo = true AND stock > 0 
                        AND (categoria ILIKE '%analg%' OR categoria ILIKE '%vitamina%' OR categoria ILIKE '%suplement%' OR nombre ILIKE '%paracetamol%' OR nombre ILIKE '%ibuprofeno%' OR nombre ILIKE '%vitamina%')
                        ORDER BY stock ASC
                        LIMIT 5
                    `;
                }

                // Si hay lluvia o humedad alta, priorizar antihistamínicos
                if (clima.humedad > 70 || clima.descripcion.toLowerCase().includes('lluvia')) {
                    query = query.replace('LIMIT 5', 'AND (categoria ILIKE \'%antihist%\' OR nombre ILIKE \'%loratadina%\' OR nombre ILIKE \'%cetirizina%\') LIMIT 5');
                }

                const result = await db.query(query);
                recomendaciones = result.rows.map(row => row.nombre);

                // Si no hay suficientes, agregar genéricos como fallback final
                if (recomendaciones.length < 3) {
                    recomendaciones.push('Paracetamol', 'Vitamina C', 'Ibuprofeno');
                    recomendaciones = [...new Set(recomendaciones)].slice(0, 5); // Eliminar duplicados
                }
            }

            // Si aún vacío, usar genéricos
            if (recomendaciones.length === 0) {
                recomendaciones = ['Paracetamol', 'Vitamina C', 'Ibuprofeno'];
            }

        } catch (error) {
            console.error('Error en consulta fallback:', error);
            // Fallback final hard-coded
            recomendaciones = ['Paracetamol', 'Vitamina C', 'Ibuprofeno'];
        }

        return {
            success: true,
            recomendaciones: recomendaciones.slice(0, 5).join(", "),
            clima: {
                ciudad: clima.ciudad,
                temperatura: clima.temperatura || tempNeutral,
                descripcion: clima.descripcion || descNeutral,
                humedad: clima.humedad || humNeutral
            },
            timestamp: new Date().toISOString(),
            fallback: true
        };
    }
}

module.exports = IAInventarioService;
