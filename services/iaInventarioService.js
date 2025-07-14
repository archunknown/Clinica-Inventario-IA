const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));
const db = require('../models/db');

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
}

module.exports = IAInventarioService;
