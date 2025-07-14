# 📚 Guía de Despliegue en Render - Clínica Inventario IA

Esta guía te llevará paso a paso para desplegar tu aplicación en Render.

## 🚀 Pasos para el Despliegue

### 1. Preparación del Código

Primero, asegúrate de que tu código esté en GitHub:

1. **Crear repositorio en GitHub**:
   - Ve a [GitHub](https://github.com) y crea un nuevo repositorio
   - Nombre sugerido: `clinica-inventario-ia`
   - Hazlo privado si prefieres

2. **Subir tu código**:
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git branch -M main
   git remote add origin https://github.com/TU_USUARIO/clinica-inventario-ia.git
   git push -u origin main
   ```

### 2. Crear cuenta en Render

1. Ve a [Render.com](https://render.com)
2. Regístrate con tu cuenta de GitHub (recomendado)
3. Verifica tu email

### 3. Crear Base de Datos PostgreSQL

1. En el dashboard de Render, haz clic en **"New +"**
2. Selecciona **"PostgreSQL"**
3. Configura:
   - **Name**: `clinica-db`
   - **Database**: `clinica_inventario`
   - **User**: `clinica_user`
   - **Region**: Selecciona la más cercana a ti
   - **PostgreSQL Version**: 15
   - **Plan**: Free (puedes cambiar después)
4. Haz clic en **"Create Database"**
5. **IMPORTANTE**: Guarda la URL de conexión que te proporciona Render

### 4. Crear el Web Service

1. En el dashboard, haz clic en **"New +"**
2. Selecciona **"Web Service"**
3. Conecta tu repositorio de GitHub
4. Configura:
   - **Name**: `clinica-inventario-ia`
   - **Region**: La misma que tu base de datos
   - **Branch**: `main`
   - **Root Directory**: (déjalo vacío)
   - **Runtime**: `Node`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Plan**: Free

### 5. Configurar Variables de Entorno

En la configuración de tu Web Service, ve a **"Environment"** y agrega:

```
PORT=3000
NODE_ENV=production
OPENAI_API_KEY=tu_api_key_de_openai
```

Las variables de PostgreSQL se configurarán automáticamente si usaste el archivo `render.yaml`.

### 6. Configurar la Base de Datos

1. Ve a tu base de datos en Render
2. En la pestaña **"Info"**, copia el **"PSQL Command"**
3. Conéctate usando ese comando en tu terminal
4. Ejecuta el contenido de `database/init.sql`

**Alternativa más fácil**:
1. En Render, ve a tu base de datos
2. Ve a la pestaña **"Connect"**
3. Usa las credenciales para conectarte con pgAdmin
4. Ejecuta el script SQL

### 7. Inicializar Datos

Después del primer despliegue:

1. Ve a la pestaña **"Shell"** de tu Web Service
2. Ejecuta:
   ```bash
   node init_db.js
   ```

### 8. Configurar Usuario Administrador

1. Genera un hash bcrypt para tu contraseña:
   ```bash
   # En tu máquina local
   node -e "const bcrypt = require('bcrypt'); bcrypt.hash('TU_PASSWORD', 10).then(console.log)"
   ```

2. Actualiza el usuario admin en la base de datos con el hash generado

## 🔧 Solución de Problemas Comunes

### Error: "Cannot find module"
- Asegúrate de que todas las dependencias estén en `package.json`
- Verifica que no haya archivos en `.gitignore` que deberían estar en el repo

### Error de conexión a base de datos
- Verifica que las variables de entorno estén correctamente configuradas
- Asegúrate de que la base de datos esté activa

### Error con Puppeteer
- Puppeteer puede tener problemas en el plan gratuito
- Considera usar un buildpack específico o cambiar a un plan pagado

### La aplicación no carga
- Revisa los logs en Render
- Verifica que el puerto sea el correcto
- Asegúrate de que todas las rutas estén configuradas correctamente

## 📝 Notas Importantes

1. **API Key de OpenAI**: Necesitas una API key válida de OpenAI para que funcione el asistente IA
2. **Límites del plan gratuito**: 
   - La base de datos se suspende después de 90 días de inactividad
   - El servicio web se apaga después de 15 minutos sin tráfico
3. **Backups**: Configura backups regulares de tu base de datos

## 🎉 ¡Listo!

Una vez completados estos pasos, tu aplicación debería estar funcionando en:
```
https://clinica-inventario-ia.onrender.com
```

## 📞 Soporte

Si tienes problemas:
1. Revisa los logs en Render
2. Verifica la documentación de Render
3. Asegúrate de que todas las variables de entorno estén configuradas

¡Buena suerte con tu despliegue! 🚀
