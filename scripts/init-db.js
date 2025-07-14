const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

async function initDB() {
  try {
    console.log('🔄 Inicializando base de datos...');
    
    // Crear tabla usuarios
    await pool.query(`
      CREATE TABLE IF NOT EXISTS usuarios (
        id SERIAL PRIMARY KEY,
        username VARCHAR(50) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        rol VARCHAR(20) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✅ Tabla usuarios creada/verificada');
    
    // Crear tabla clientes
    await pool.query(`
      CREATE TABLE IF NOT EXISTS clientes (
        id SERIAL PRIMARY KEY,
        nombre VARCHAR(100) NOT NULL,
        telefono VARCHAR(20),
        email VARCHAR(100),
        direccion TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✅ Tabla clientes creada/verificada');
    
    // Crear tabla medicamentos
    await pool.query(`
      CREATE TABLE IF NOT EXISTS medicamentos (
        id SERIAL PRIMARY KEY,
        nombre VARCHAR(100) NOT NULL,
        categoria VARCHAR(50),
        descripcion TEXT,
        stock INTEGER DEFAULT 0,
        stock_minimo INTEGER DEFAULT 10,
        precio DECIMAL(10,2),
        fecha_vencimiento DATE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✅ Tabla medicamentos creada/verificada');
    
    // Crear tabla ventas
    await pool.query(`
      CREATE TABLE IF NOT EXISTS ventas (
        id SERIAL PRIMARY KEY,
        cliente_id INTEGER REFERENCES clientes(id),
        usuario_id INTEGER REFERENCES usuarios(id),
        total DECIMAL(10,2) NOT NULL,
        fecha TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        estado VARCHAR(20) DEFAULT 'completada'
      )
    `);
    console.log('✅ Tabla ventas creada/verificada');
    
    // Crear tabla detalle_venta
    await pool.query(`
      CREATE TABLE IF NOT EXISTS detalle_venta (
        id SERIAL PRIMARY KEY,
        venta_id INTEGER REFERENCES ventas(id),
        medicamento_id INTEGER REFERENCES medicamentos(id),
        cantidad INTEGER NOT NULL,
        precio_unitario DECIMAL(10,2) NOT NULL,
        subtotal DECIMAL(10,2) NOT NULL
      )
    `);
    console.log('✅ Tabla detalle_venta creada/verificada');
    
    // Insertar usuario admin (contraseña: admin123)
    const result = await pool.query(`
      INSERT INTO usuarios (username, password, rol) 
      VALUES ('admin', '$2b$10$csK7oydEWQstkD7k2x3V1uISpHXSeN56uNIAHCYmBqiuIST1aiCAy', 'administrador')
      ON CONFLICT (username) DO UPDATE 
      SET password = '$2b$10$csK7oydEWQstkD7k2x3V1uISpHXSeN56uNIAHCYmBqiuIST1aiCAy'
      RETURNING id
    `);
    
    if (result.rowCount > 0) {
      console.log('✅ Usuario admin creado');
    } else {
      console.log('ℹ️ Usuario admin ya existe');
    }
    
    // Verificar tablas creadas
    const tables = await pool.query(`
      SELECT table_name FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name
    `);
    
    console.log('\n📋 Tablas en la base de datos:');
    tables.rows.forEach(row => {
      console.log(`   - ${row.table_name}`);
    });
    
    console.log('\n✅ Base de datos inicializada correctamente');
  } catch (error) {
    console.error('❌ Error inicializando DB:', error);
    // No lanzar el error para que la aplicación pueda continuar
  } finally {
    await pool.end();
  }
}

// Solo ejecutar si se llama directamente
if (require.main === module) {
  initDB();
} else {
  module.exports = initDB;
}
