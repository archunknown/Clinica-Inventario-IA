const { Pool } = require('pg');
require('dotenv').config();

// Configuración de la base de datos
let poolConfig;

if (process.env.DATABASE_URL) {
  // En producción (Render) usar DATABASE_URL
  poolConfig = {
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
  };
} else {
  // En desarrollo usar variables individuales
  poolConfig = {
    host: process.env.PGHOST || 'localhost',
    port: process.env.PGPORT || 5432,
    database: process.env.PGDATABASE || 'clinica_inventario',
    user: process.env.PGUSER || 'postgres',
    password: process.env.PGPASSWORD || ''
  };
}

const pool = new Pool(poolConfig);

pool.connect()
  .then(() => console.log('✅ Conectado a PostgreSQL correctamente'))
  .catch(err => console.error('❌ Error al conectar a PostgreSQL:', err));

module.exports = pool;
