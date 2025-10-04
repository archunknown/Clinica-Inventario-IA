const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

// Cache para almacenar datos del clima temporalmente
let weatherCache = {
    data: null,
    timestamp: null,
    cacheDuration: 30 * 60 * 1000 // 30 minutos
};

class WeatherService {
    // Obtener datos del clima actual
    static async obtenerClimaActual() {
        // COMENTADO: Llamadas a API de OpenWeather para forzar fallback
        /*
        try {
            // Verificar si hay datos en cache válidos
            const ahora = Date.now();
            if (weatherCache.data &&
                weatherCache.timestamp &&
                (ahora - weatherCache.timestamp) < weatherCache.cacheDuration) {
                return weatherCache.data;
            }

            const apiKey = process.env.OPENWEATHER_API_KEY;
            console.log('API Key configurada:', apiKey ? 'Sí' : 'No');
            if (!apiKey) {
                throw new Error('OPENWEATHER_API_KEY no configurada en las variables de entorno');
            }

            // Ciudad por defecto: Chincha, Ica, Perú
            const ciudad = 'Chincha';
            const pais = 'PE';
            const url = `https://api.openweathermap.org/data/2.5/weather?q=${ciudad},${pais}&appid=${apiKey}&units=metric&lang=es`;

            console.log('Consultando API del clima para:', ciudad, pais);
            console.log('URL:', url.replace(apiKey, 'API_KEY_HIDED'));

            // Retry logic with timeout
            let response;
            let lastError;
            for (let attempt = 1; attempt <= 3; attempt++) {
                try {
                    const controller = new AbortController();
                    const timeoutId = setTimeout(() => controller.abort(), 10000);
                    response = await fetch(url, { signal: controller.signal });
                    clearTimeout(timeoutId);
                    break;
                } catch (error) {
                    lastError = error;
                    console.log(`Intento ${attempt} fallido: ${error.message}`);
                    if (attempt === 3) throw lastError;
                    await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
                }
            }

            const data = await response.json();

            console.log('Respuesta de OpenWeather:', { status: response.status, dataKeys: Object.keys(data) });

            if (!response.ok) {
                throw new Error(`Error en API del clima (${response.status}): ${data.message || 'Error desconocido'}`);
            }

            if (!data.main || !data.weather || !data.weather[0]) {
                throw new Error('Respuesta de API incompleta - faltan datos requeridos');
            }

            // Procesar datos del clima
            const climaProcesado = {
                ciudad: data.name,
                pais: data.sys.country,
                temperatura: Math.round(data.main.temp),
                sensacion_termica: Math.round(data.main.feels_like),
                humedad: data.main.humidity,
                descripcion: data.weather[0].description,
                condicion_principal: data.weather[0].main,
                viento_velocidad: data.wind?.speed || 0,
                nubosidad: data.clouds?.all || 0,
                visibilidad: data.visibility ? (data.visibility / 1000).toFixed(1) : 'N/A',
                presion: data.main.pressure,
                punto_rocio: Math.round(data.main.temp_min),
                amanecer: new Date(data.sys.sunrise * 1000).toLocaleTimeString('es-PE'),
                atardecer: new Date(data.sys.sunset * 1000).toLocaleTimeString('es-PE'),
                ultimo_actualizado: new Date(data.dt * 1000).toLocaleString('es-PE')
            };

            const currentTime = Date.now();

            // Guardar en cache
            weatherCache = {
                data: climaProcesado,
                timestamp: currentTime
            };

            return climaProcesado;

        } catch (error) {
        */
            console.error('OpenWeather API deshabilitada - usando fallback');

            // Datos de fallback actualizados para coincidir con clima típico de Chincha (16°C, nubes, 59% humedad)
            const climaFallback = {
                ciudad: 'Chincha',
                pais: 'PE',
                temperatura: 24,
                sensacion_termica: 16,
                humedad: 29,
                descripcion: 'nubes cubiertas',
                condicion_principal: 'Clouds',
                viento_velocidad: 3.5,
                nubosidad: 90,
                error: true,
                mensaje_error: 'OpenWeather API deshabilitada para usar solo fallback'
            };

            console.log('Usando datos de fallback para el clima');
            return climaFallback;
        /*
        }
        */
    }

    // Obtener descripción del clima en español
    static obtenerDescripcionClima(clima) {
        const temp = clima.temperatura;
        const humedad = clima.humedad;
        const descripcion = clima.descripcion.toLowerCase();

        let descripcionCompleta = `El clima actual en ${clima.ciudad} es ${descripcion} con ${temp}°C`;

        // Agregar contexto adicional basado en temperatura
        if (temp < 15) {
            descripcionCompleta += ' (frío)';
        } else if (temp < 25) {
            descripcionCompleta += ' (templado)';
        } else {
            descripcionCompleta += ' (calor)';
        }

        // Agregar información de humedad si es relevante
        if (humedad > 80) {
            descripcionCompleta += ', alta humedad';
        } else if (humedad < 40) {
            descripcionCompleta += ', baja humedad';
        }

        return descripcionCompleta;
    }

    // Limpiar cache manualmente (útil para testing)
    static limpiarCache() {
        weatherCache = {
            data: null,
            timestamp: null
        };
    }
}

module.exports = WeatherService;
