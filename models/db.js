const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  host: process.env.PGHOST,
  port: process.env.PGPORT,
  database: process.env.PGDATABASE,
  user: process.env.PGUSER,
  password: process.env.PGPASSWORD,
});

pool.connect()
  .then(() => console.log('✅ Conectado a PostgreSQL correctamente'))
  .catch(err => console.error('❌ Error al conectar a PostgreSQL:', err));

module.exports = pool;
