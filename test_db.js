const db = require('./models/db');

db.query('SELECT * FROM usuarios')
  .then(result => {
    console.log('Usuarios:', result.rows);
    process.exit(); // Salir luego de ejecutar
  })
  .catch(err => {
    console.error('Error al hacer consulta:', err);
    process.exit(1);
  });
