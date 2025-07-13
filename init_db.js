const MedicamentoModel = require('./models/medicamentoModel');
const db = require('./models/db');

async function initializeDatabase() {
    try {
        console.log('🔄 Inicializando base de datos...');
        
        // Crear tabla de medicamentos
        await MedicamentoModel.createTable();
        
        // Verificar si ya existen medicamentos
        const medicamentosExistentes = await MedicamentoModel.getAll();
        
        if (medicamentosExistentes.length === 0) {
            console.log('📦 Insertando medicamentos de ejemplo...');
            
            const medicamentosEjemplo = [
                {
                    nombre: 'Paracetamol 500mg',
                    categoria: 'Analgésicos',
                    descripcion: 'Analgésico y antipirético para el alivio del dolor y la fiebre',
                    stock: 150,
                    stock_minimo: 20,
                    precio: 2.50,
                    fecha_vencimiento: '2025-12-31'
                },
                {
                    nombre: 'Ibuprofeno 400mg',
                    categoria: 'Antiinflamatorios',
                    descripcion: 'Antiinflamatorio no esteroideo para dolor e inflamación',
                    stock: 80,
                    stock_minimo: 15,
                    precio: 3.75,
                    fecha_vencimiento: '2025-10-15'
                },
                {
                    nombre: 'Amoxicilina 500mg',
                    categoria: 'Antibióticos',
                    descripcion: 'Antibiótico de amplio espectro para infecciones bacterianas',
                    stock: 45,
                    stock_minimo: 10,
                    precio: 8.90,
                    fecha_vencimiento: '2025-08-20'
                },
                {
                    nombre: 'Omeprazol 20mg',
                    categoria: 'Digestivos',
                    descripción: 'Inhibidor de la bomba de protones para problemas gástricos',
                    stock: 120,
                    stock_minimo: 25,
                    precio: 5.25,
                    fecha_vencimiento: '2026-01-10'
                },
                {
                    nombre: 'Loratadina 10mg',
                    categoria: 'Antihistamínicos',
                    descripcion: 'Antihistamínico para alergias y rinitis',
                    stock: 90,
                    stock_minimo: 20,
                    precio: 4.50,
                    fecha_vencimiento: '2025-11-30'
                },
                {
                    nombre: 'Vitamina C 1000mg',
                    categoria: 'Vitaminas',
                    descripcion: 'Suplemento vitamínico para reforzar el sistema inmunológico',
                    stock: 200,
                    stock_minimo: 30,
                    precio: 6.75,
                    fecha_vencimiento: '2026-03-15'
                },
                {
                    nombre: 'Aspirina 100mg',
                    categoria: 'Cardiovasculares',
                    descripcion: 'Antiagregante plaquetario para prevención cardiovascular',
                    stock: 75,
                    stock_minimo: 15,
                    precio: 3.20,
                    fecha_vencimiento: '2025-09-25'
                },
                {
                    nombre: 'Salbutamol Inhalador',
                    categoria: 'Respiratorios',
                    descripcion: 'Broncodilatador para el tratamiento del asma',
                    stock: 25,
                    stock_minimo: 5,
                    precio: 15.80,
                    fecha_vencimiento: '2025-07-10'
                },
                {
                    nombre: 'Diclofenaco Gel',
                    categoria: 'Dermatológicos',
                    descripcion: 'Gel antiinflamatorio para uso tópico',
                    stock: 60,
                    stock_minimo: 12,
                    precio: 7.90,
                    fecha_vencimiento: '2025-12-05'
                },
                {
                    nombre: 'Metformina 850mg',
                    categoria: 'Endocrinos',
                    descripcion: 'Antidiabético oral para diabetes tipo 2',
                    stock: 110,
                    stock_minimo: 20,
                    precio: 4.25,
                    fecha_vencimiento: '2026-02-28'
                },
                {
                    nombre: 'Enalapril 10mg',
                    categoria: 'Cardiovasculares',
                    descripcion: 'Inhibidor de la ECA para hipertensión arterial',
                    stock: 85,
                    stock_minimo: 18,
                    precio: 5.60,
                    fecha_vencimiento: '2025-11-12'
                },
                {
                    nombre: 'Cetirizina 10mg',
                    categoria: 'Antihistamínicos',
                    descripcion: 'Antihistamínico de segunda generación',
                    stock: 95,
                    stock_minimo: 20,
                    precio: 3.85,
                    fecha_vencimiento: '2025-10-08'
                },
                {
                    nombre: 'Simvastatina 20mg',
                    categoria: 'Cardiovasculares',
                    descripcion: 'Estatina para el control del colesterol',
                    stock: 70,
                    stock_minimo: 15,
                    precio: 6.40,
                    fecha_vencimiento: '2025-12-20'
                },
                {
                    nombre: 'Clotrimazol Crema',
                    categoria: 'Dermatológicos',
                    descripcion: 'Antifúngico tópico para infecciones por hongos',
                    stock: 40,
                    stock_minimo: 8,
                    precio: 8.75,
                    fecha_vencimiento: '2025-09-15'
                },
                {
                    nombre: 'Complejo B',
                    categoria: 'Vitaminas',
                    descripcion: 'Suplemento de vitaminas del complejo B',
                    stock: 130,
                    stock_minimo: 25,
                    precio: 9.50,
                    fecha_vencimiento: '2026-04-30'
                },
                {
                    nombre: 'Ranitidina 150mg',
                    categoria: 'Digestivos',
                    descripcion: 'Antagonista H2 para problemas gástricos',
                    stock: 15,
                    stock_minimo: 10,
                    precio: 4.80,
                    fecha_vencimiento: '2025-06-18'
                },
                {
                    nombre: 'Dexametasona 4mg',
                    categoria: 'Antiinflamatorios',
                    descripcion: 'Corticosteroide para procesos inflamatorios',
                    stock: 35,
                    stock_minimo: 8,
                    precio: 12.30,
                    fecha_vencimiento: '2025-08-25'
                },
                {
                    nombre: 'Captopril 25mg',
                    categoria: 'Cardiovasculares',
                    descripcion: 'Inhibidor de la ECA para hipertensión',
                    stock: 55,
                    stock_minimo: 12,
                    precio: 3.95,
                    fecha_vencimiento: '2025-10-30'
                },
                {
                    nombre: 'Ketoconazol Shampoo',
                    categoria: 'Dermatológicos',
                    descripcion: 'Shampoo antifúngico para caspa y dermatitis seborreica',
                    stock: 30,
                    stock_minimo: 6,
                    precio: 11.25,
                    fecha_vencimiento: '2025-11-08'
                },
                {
                    nombre: 'Furosemida 40mg',
                    categoria: 'Cardiovasculares',
                    descripcion: 'Diurético de asa para retención de líquidos',
                    stock: 18,
                    stock_minimo: 5,
                    precio: 2.75,
                    fecha_vencimiento: '2025-07-22'
                }
            ];
            
            // Insertar medicamentos de ejemplo
            for (const medicamento of medicamentosEjemplo) {
                try {
                    await MedicamentoModel.create(medicamento);
                    console.log(`✅ Medicamento creado: ${medicamento.nombre}`);
                } catch (error) {
                    console.error(`❌ Error al crear ${medicamento.nombre}:`, error.message);
                }
            }
            
            console.log('🎉 Base de datos inicializada con medicamentos de ejemplo');
        } else {
            console.log('📋 La base de datos ya contiene medicamentos');
        }
        
        // Mostrar estadísticas
        const stats = await MedicamentoModel.getStats();
        console.log('\n📊 Estadísticas del inventario:');
        console.log(`   Total de productos: ${stats.total_productos}`);
        console.log(`   Total de unidades: ${stats.total_unidades}`);
        console.log(`   Valor total: S/ ${parseFloat(stats.valor_total).toFixed(2)}`);
        console.log(`   Productos con stock bajo: ${stats.productos_stock_bajo}`);
        
        console.log('\n✅ Inicialización completada exitosamente');
        
    } catch (error) {
        console.error('❌ Error al inicializar la base de datos:', error);
        throw error;
    }
}

// Ejecutar si se llama directamente
if (require.main === module) {
    initializeDatabase()
        .then(() => {
            console.log('🏁 Proceso completado');
            process.exit(0);
        })
        .catch((error) => {
            console.error('💥 Error fatal:', error);
            process.exit(1);
        });
}

module.exports = { initializeDatabase };
