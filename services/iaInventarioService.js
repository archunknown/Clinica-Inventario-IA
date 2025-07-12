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
            // Obtener datos actuales del inventario
            const inventario = await this.obtenerContextoInventario();
            
            // Crear contexto para la IA
            const context = `
Eres un asistente médico inteligente de una clínica. Tu tarea es responder de manera natural, profesional y clara preguntas sobre el inventario de medicamentos.

INVENTARIO ACTUAL DE MEDICAMENTOS:
${JSON.stringify(inventario, null, 2)}

INSTRUCCIONES:
1. Responde de forma natural y conversacional
2. Si el usuario escribe con errores ortográficos o de forma informal, igual debes entenderlo
3. Proporciona información útil sobre los medicamentos disponibles
4. Si preguntan por algo que no está en el inventario, indícalo claramente
5. Cuando menciones cantidades, usa las unidades apropiadas
6. Si es relevante, menciona la categoría del medicamento
7. Sé conciso pero completo en tus respuestas

EJEMPLOS DE RESPUESTAS:
- "Sí, tenemos Amoxicilina disponible. Actualmente contamos con 30 cápsulas en stock."
- "Para la gripe, tenemos disponibles: Paracetamol (50 tabletas) y otros analgésicos que pueden ayudar con los síntomas."
- "Lo siento, no tenemos ese medicamento en nuestro inventario actual."
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
}

module.exports = IAInventarioService;
