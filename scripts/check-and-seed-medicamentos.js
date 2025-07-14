require('dotenv').config();
const db = require('../models/db');

async function checkAndSeedMedicamentos() {
    try {
        console.log('🔍 Verificando medicamentos en la base de datos...');
        
        // Verificar cuántos medicamentos hay
        const countResult = await db.query('SELECT COUNT(*) as total FROM medicamentos');
        const totalMedicamentos = parseInt(countResult.rows[0].total);
        
        console.log(`📊 Total de medicamentos encontrados: ${totalMedicamentos}`);
        
        if (totalMedicamentos === 0) {
            console.log('⚠️ No hay medicamentos en la base de datos');
            console.log('🌱 Insertando medicamentos de prueba...');
            
            const medicamentosDePrueba = [
                {
                    nombre: 'Paracetamol 500mg',
                    categoria: 'Analgésicos',
                    descripcion: 'Analgésico y antipirético',
                    stock: 100,
                    precio: 5.50,
                    unidad: 'tabletas'
                },
                {
                    nombre: 'Ibuprofeno 400mg',
                    categoria: 'Antiinflamatorios',
                    descripcion: 'Antiinflamatorio no esteroideo',
                    stock: 80,
                    precio: 8.00,
                    unidad: 'tabletas'
                },
                {
                    nombre: 'Amoxicilina 500mg',
                    categoria: 'Antibióticos',
                    descripcion: 'Antibiótico de amplio espectro',
                    stock: 50,
                    precio: 12.50,
                    unidad: 'cápsulas'
                },
                {
                    nombre: 'Omeprazol 20mg',
                    categoria: 'Antiácidos',
                    descripcion: 'Inhibidor de la bomba de protones',
                    stock: 60,
                    precio: 15.00,
                    unidad: 'cápsulas'
                },
                {
                    nombre: 'Loratadina 10mg',
                    categoria: 'Antihistamínicos',
                    descripcion: 'Antihistamínico para alergias',
                    stock: 40,
                    precio: 10.00,
                    unidad: 'tabletas'
                },
                {
                    nombre: 'Diclofenaco 50mg',
                    categoria: 'Antiinflamatorios',
                    descripcion: 'Antiinflamatorio y analgésico',
                    stock: 70,
                    precio: 9.50,
                    unidad: 'tabletas'
                },
                {
                    nombre: 'Metformina 850mg',
                    categoria: 'Antidiabéticos',
                    descripcion: 'Medicamento para diabetes tipo 2',
                    stock: 45,
                    precio: 18.00,
                    unidad: 'tabletas'
                },
                {
                    nombre: 'Atorvastatina 20mg',
                    categoria: 'Hipolipemiantes',
                    descripcion: 'Reduce el colesterol',
                    stock: 35,
                    precio: 25.00,
                    unidad: 'tabletas'
                },
                {
                    nombre: 'Salbutamol Inhalador',
                    categoria: 'Broncodilatadores',
                    descripcion: 'Para el asma y broncoespasmo',
                    stock: 25,
                    precio: 35.00,
                    unidad: 'inhalador'
                },
                {
                    nombre: 'Vitamina C 1000mg',
                    categoria: 'Vitaminas',
                    descripcion: 'Suplemento vitamínico',
                    stock: 120,
                    precio: 7.50,
                    unidad: 'tabletas'
                }
            ];
            
            for (const medicamento of medicamentosDePrueba) {
                const query = `
                    INSERT INTO medicamentos (nombre, categoria, descripcion, stock, precio, unidad, activo)
                    VALUES ($1, $2, $3, $4, $5, $6, true)
                `;
                
                await db.query(query, [
                    medicamento.nombre,
                    medicamento.categoria,
                    medicamento.descripcion,
                    medicamento.stock,
                    medicamento.precio,
                    medicamento.unidad
                ]);
                
                console.log(`✅ Insertado: ${medicamento.nombre}`);
            }
            
            console.log('\n✅ Medicamentos de prueba insertados exitosamente');
        } else {
            console.log('✅ Ya existen medicamentos en la base de datos');
            
            // Mostrar algunos medicamentos
            const medicamentosResult = await db.query('SELECT id, nombre, categoria, stock, precio FROM medicamentos LIMIT 5');
            console.log('\n📋 Primeros 5 medicamentos:');
            medicamentosResult.rows.forEach(med => {
                console.log(`  - ID: ${med.id}, ${med.nombre} (${med.categoria}) - Stock: ${med.stock}, Precio: S/ ${med.precio}`);
            });
        }
        
    } catch (error) {
        console.error('❌ Error:', error);
    } finally {
        await db.end();
    }
}

// Ejecutar
checkAndSeedMedicamentos();
