const bcrypt = require('bcrypt');

// Obtener la contraseña del argumento de línea de comandos
const password = process.argv[2];

if (!password) {
    console.log('❌ Error: Debes proporcionar una contraseña');
    console.log('Uso: node scripts/hash-password.js TU_CONTRASEÑA');
    process.exit(1);
}

// Generar el hash
bcrypt.hash(password, 10)
    .then(hash => {
        console.log('\n✅ Contraseña hasheada exitosamente:');
        console.log('=====================================');
        console.log(hash);
        console.log('=====================================');
        console.log('\n📝 Usa este hash en tu base de datos para el usuario admin');
        console.log('\nEjemplo de SQL:');
        console.log(`UPDATE usuarios SET password = '${hash}' WHERE username = 'admin';`);
    })
    .catch(err => {
        console.error('❌ Error al hashear la contraseña:', err);
        process.exit(1);
    });
