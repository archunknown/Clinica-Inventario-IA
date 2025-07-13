// Variables globales
let medicamentos = [];
let medicamentoEditando = null;
let medicamentoEliminar = null;

// Inicializar página
document.addEventListener('DOMContentLoaded', function() {
    cargarMedicamentos();
    configurarEventListeners();
});

// Configurar event listeners
function configurarEventListeners() {
    // Filtros
    document.getElementById('searchInput').addEventListener('input', aplicarFiltros);
    document.getElementById('filterCategory').addEventListener('change', aplicarFiltros);
    document.getElementById('filterStock').addEventListener('change', aplicarFiltros);
    
    // Cerrar modal al hacer clic fuera
    window.onclick = function(event) {
        const modalMedicamento = document.getElementById('modalMedicamento');
        const modalConfirmar = document.getElementById('modalConfirmar');
        
        if (event.target === modalMedicamento) {
            cerrarModal();
        }
        if (event.target === modalConfirmar) {
            cerrarModalConfirmar();
        }
    }
}

// Cargar medicamentos desde la API
async function cargarMedicamentos() {
    try {
        mostrarLoading(true);
        
        const response = await fetch('/api/inventario');
        const data = await response.json();
        
        if (data.success) {
            medicamentos = data.data;
            mostrarMedicamentos(medicamentos);
            actualizarEstadisticas();
            cargarCategorias();
        } else {
            throw new Error(data.message);
        }
    } catch (error) {
        console.error('Error al cargar medicamentos:', error);
        mostrarError('Error al cargar el inventario');
    } finally {
        mostrarLoading(false);
    }
}

// Mostrar medicamentos en la tabla
function mostrarMedicamentos(medicamentosData) {
    const tbody = document.getElementById('medicamentosTableBody');
    
    if (medicamentosData.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="7" class="text-center p-4">
                    <p>No se encontraron medicamentos</p>
                </td>
            </tr>
        `;
        return;
    }
    
    tbody.innerHTML = medicamentosData.map(medicamento => {
        const stockClass = getStockClass(medicamento.stock);
        const stockBadge = getStockBadge(medicamento.stock);
        
        return `
            <tr>
                <td>#${String(medicamento.id).padStart(4, '0')}</td>
                <td>
                    <strong>${medicamento.nombre}</strong>
                    ${medicamento.fecha_vencimiento ? 
                        `<br><small style="color: var(--text-muted);">Vence: ${formatearFecha(medicamento.fecha_vencimiento)}</small>` 
                        : ''
                    }
                </td>
                <td>
                    <span class="badge" style="background: var(--color3); color: var(--text-light); padding: 4px 8px; border-radius: 12px; font-size: 0.8rem;">
                        ${medicamento.categoria}
                    </span>
                </td>
                <td>
                    <span title="${medicamento.descripcion || 'Sin descripción'}">
                        ${truncarTexto(medicamento.descripcion || 'Sin descripción', 50)}
                    </span>
                </td>
                <td>
                    <div style="display: flex; align-items: center; gap: 8px;">
                        <span class="stock-badge ${stockClass}">${medicamento.stock}</span>
                        ${stockBadge}
                    </div>
                </td>
                <td>
                    <strong style="color: var(--accent);">S/ ${parseFloat(medicamento.precio).toFixed(2)}</strong>
                </td>
                <td>
                    <div class="action-buttons">
                        <button class="btn-action btn-cart" onclick="agregarAlCarrito(${medicamento.id})" title="Agregar al carrito" ${medicamento.stock <= 0 ? 'disabled' : ''}>
                            🛒 Carrito
                        </button>
                        <button class="btn-action btn-edit" onclick="editarMedicamento(${medicamento.id})" title="Editar">
                            ✏️ Editar
                        </button>
                        <button class="btn-action btn-delete" onclick="eliminarMedicamento(${medicamento.id}, '${medicamento.nombre}')" title="Eliminar">
                            🗑️ Eliminar
                        </button>
                    </div>
                </td>
            </tr>
        `;
    }).join('');
}

// Obtener clase CSS para el stock
function getStockClass(stock) {
    if (stock < 20) return 'stock-bajo';
    if (stock <= 50) return 'stock-normal';
    return 'stock-alto';
}

// Obtener badge de estado de stock
function getStockBadge(stock) {
    if (stock < 20) return '<span title="Stock bajo">⚠️</span>';
    if (stock <= 50) return '<span title="Stock normal">📊</span>';
    return '<span title="Stock alto">✅</span>';
}

// Truncar texto
function truncarTexto(texto, limite) {
    if (texto.length <= limite) return texto;
    return texto.substring(0, limite) + '...';
}

// Formatear fecha
function formatearFecha(fecha) {
    return new Date(fecha).toLocaleDateString('es-ES');
}

// Actualizar estadísticas
function actualizarEstadisticas() {
    const totalProductos = medicamentos.length;
    const totalUnidades = medicamentos.reduce((sum, med) => sum + parseInt(med.stock), 0);
    const valorTotal = medicamentos.reduce((sum, med) => sum + (parseFloat(med.precio) * parseInt(med.stock)), 0);
    const stockBajo = medicamentos.filter(med => parseInt(med.stock) < 20).length;
    
    document.getElementById('totalProductos').textContent = totalProductos.toLocaleString();
    document.getElementById('totalUnidades').textContent = totalUnidades.toLocaleString();
    document.getElementById('valorTotal').textContent = `S/ ${valorTotal.toFixed(2)}`;
    document.getElementById('stockBajo').textContent = stockBajo.toLocaleString();
    
    // Mostrar/ocultar alerta de stock bajo
    const alertStockBajo = document.getElementById('alertStockBajo');
    if (stockBajo > 0) {
        alertStockBajo.style.display = 'flex';
    } else {
        alertStockBajo.style.display = 'none';
    }
}

// Cargar categorías para filtros
function cargarCategorias() {
    const categorias = [...new Set(medicamentos.map(med => med.categoria))];
    const selectCategoria = document.getElementById('filterCategory');
    
    // Limpiar opciones existentes (excepto la primera)
    selectCategoria.innerHTML = '<option value="">Todas las categorías</option>';
    
    categorias.forEach(categoria => {
        const option = document.createElement('option');
        option.value = categoria;
        option.textContent = categoria;
        selectCategoria.appendChild(option);
    });
}

// Aplicar filtros
function aplicarFiltros() {
    const searchTerm = document.getElementById('searchInput').value.toLowerCase();
    const categoryFilter = document.getElementById('filterCategory').value;
    const stockFilter = document.getElementById('filterStock').value;
    
    let medicamentosFiltrados = medicamentos.filter(medicamento => {
        // Filtro de búsqueda
        const matchesSearch = !searchTerm || 
            medicamento.nombre.toLowerCase().includes(searchTerm) ||
            medicamento.categoria.toLowerCase().includes(searchTerm) ||
            (medicamento.descripcion && medicamento.descripcion.toLowerCase().includes(searchTerm));
        
        // Filtro de categoría
        const matchesCategory = !categoryFilter || medicamento.categoria === categoryFilter;
        
        // Filtro de stock
        let matchesStock = true;
        if (stockFilter) {
            const stock = parseInt(medicamento.stock);
            switch (stockFilter) {
                case 'bajo':
                    matchesStock = stock < 20;
                    break;
                case 'normal':
                    matchesStock = stock >= 20 && stock <= 50;
                    break;
                case 'alto':
                    matchesStock = stock > 50;
                    break;
            }
        }
        
        return matchesSearch && matchesCategory && matchesStock;
    });
    
    mostrarMedicamentos(medicamentosFiltrados);
}

// Abrir modal para nuevo medicamento
function abrirModalNuevo() {
    medicamentoEditando = null;
    document.getElementById('modalTitle').textContent = 'Nuevo Medicamento';
    document.getElementById('btnGuardarTexto').textContent = 'Guardar Medicamento';
    limpiarFormulario();
    document.getElementById('modalMedicamento').style.display = 'block';
}

// Editar medicamento
function editarMedicamento(id) {
    medicamentoEditando = medicamentos.find(med => med.id === id);
    if (!medicamentoEditando) return;
    
    document.getElementById('modalTitle').textContent = 'Editar Medicamento';
    document.getElementById('btnGuardarTexto').textContent = 'Actualizar Medicamento';
    
    // Llenar formulario con datos existentes
    document.getElementById('medicamentoId').value = medicamentoEditando.id;
    document.getElementById('nombre').value = medicamentoEditando.nombre;
    document.getElementById('categoria').value = medicamentoEditando.categoria;
    document.getElementById('stock').value = medicamentoEditando.stock;
    document.getElementById('precio').value = medicamentoEditando.precio;
    document.getElementById('unidad').value = medicamentoEditando.unidad || 'unidades';
    document.getElementById('descripcion').value = medicamentoEditando.descripcion || '';
    
    document.getElementById('modalMedicamento').style.display = 'block';
}

// Eliminar medicamento
function eliminarMedicamento(id, nombre) {
    medicamentoEliminar = id;
    document.getElementById('medicamentoEliminar').textContent = nombre;
    // Mostrar modal de confirmación simple solo si no tiene ventas
    // Si tiene ventas, el backend responderá y se mostrará modal especial
    document.getElementById('modalConfirmar').style.display = 'block';
}


// Confirmar eliminación
async function confirmarEliminacion() {
    if (!medicamentoEliminar) return;
    
    try {
        mostrarLoading(true);
        
        const response = await fetch(`/api/inventario/${medicamentoEliminar}`, {
            method: 'DELETE'
        });
        
        const data = await response.json();
        
        if (data.success) {
            const mensaje = data.tipo === 'logico' ? 
                'Medicamento marcado como inactivo correctamente' : 
                'Medicamento eliminado correctamente';
            mostrarExito(mensaje);
            cerrarModalConfirmar();
            cargarMedicamentos();
        } else if (data.tieneVentas) {
            // El medicamento tiene ventas, mostrar opciones
            cerrarModalConfirmar();
            // Mejorar mensaje para explicar que también se eliminará detalle de venta
            data.message = "Este medicamento tiene ventas asociadas en el historial. Si elimina completamente, también se eliminarán los detalles de venta relacionados, lo que puede afectar el historial. Se recomienda usar la eliminación lógica para mantener la integridad del historial.";
            mostrarModalEliminacionConVentas(medicamentoEliminar, data);
        } else {
            throw new Error(data.message);
        }
    } catch (error) {
        console.error('Error al eliminar medicamento:', error);
        mostrarError('Error al eliminar el medicamento');
    } finally {
        mostrarLoading(false);
    }
}


// Mostrar modal especial para medicamentos con ventas
function mostrarModalEliminacionConVentas(medicamentoId, data) {
    const medicamento = medicamentos.find(med => med.id === medicamentoId);
    
    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.id = 'modalEliminacionVentas';
    modal.style.display = 'block';
    
    modal.innerHTML = `
        <div class="modal-content" style="max-width: 500px;">
            <div class="modal-header" style="background: var(--warning); color: var(--color1);">
                <h3>⚠️ Medicamento con Ventas</h3>
                <span class="close" onclick="cerrarModalEliminacionVentas()">&times;</span>
            </div>
            <div class="modal-body">
                <p><strong>${medicamento.nombre}</strong> tiene ventas asociadas en el historial.</p>
                <p style="color: var(--text-muted); margin: 15px 0;">
                    ${data.message}
                </p>
                
                <div style="background: var(--color3); padding: 15px; border-radius: 8px; margin: 15px 0;">
                    <h4 style="color: var(--accent); margin-bottom: 10px;">Opciones disponibles:</h4>
                    
                    <div style="margin-bottom: 15px;">
                        <strong style="color: var(--success);">✅ Eliminación Lógica (Recomendado)</strong>
                        <p style="font-size: 0.9rem; color: var(--text-muted); margin: 5px 0;">
                            Marca el medicamento como inactivo. Se mantiene el historial de ventas pero no aparece en el inventario activo.
                        </p>
                    </div>
                    
                    <div>
                        <strong style="color: var(--danger);">❌ Eliminación Física (No Recomendado)</strong>
                        <p style="font-size: 0.9rem; color: var(--text-muted); margin: 5px 0;">
                            Elimina completamente el medicamento. ⚠️ Esto puede causar problemas en el historial de ventas.
                        </p>
                    </div>
                </div>
            </div>
            <div class="modal-footer">
                <button type="button" class="btn-cancel" onclick="cerrarModalEliminacionVentas()">
                    Cancelar
                </button>
                <button type="button" class="btn-save" onclick="eliminarLogico(${medicamentoId})" 
                        style="background: var(--success);">
                    ✅ Marcar como Inactivo
                </button>
                <button type="button" class="btn-delete" onclick="eliminarFisico(${medicamentoId})" 
                        style="background: var(--danger);">
                    ❌ Eliminar Completamente
                </button>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
}

// Cerrar modal de eliminación con ventas
function cerrarModalEliminacionVentas() {
    const modal = document.getElementById('modalEliminacionVentas');
    if (modal) {
        modal.remove();
    }
    medicamentoEliminar = null;
}

// Eliminación lógica (marcar como inactivo)
async function eliminarLogico(medicamentoId) {
    try {
        mostrarLoading(true);
        
        const response = await fetch(`/api/inventario/${medicamentoId}?forzar=true`, {
            method: 'DELETE'
        });
        
        const data = await response.json();
        
        if (data.success) {
            mostrarExito('Medicamento marcado como inactivo correctamente');
            cerrarModalEliminacionVentas();
            cargarMedicamentos();
        } else {
            throw new Error(data.message);
        }
    } catch (error) {
        console.error('Error al marcar como inactivo:', error);
        mostrarError('Error al marcar el medicamento como inactivo');
    } finally {
        mostrarLoading(false);
    }
}

// Eliminación física (forzada)
async function eliminarFisico(medicamentoId) {
    if (!confirm('⚠️ ¿Estás COMPLETAMENTE SEGURO?\n\nEsta acción eliminará permanentemente el medicamento y puede afectar el historial de ventas.\n\nEsta acción NO se puede deshacer.')) {
        return;
    }
    
    try {
        mostrarLoading(true);
        
        // Intentar eliminación física directa
        const response = await fetch(`/api/inventario/${medicamentoId}`, {
            method: 'DELETE'
        });
        
        const data = await response.json();
        
        if (data.success) {
            mostrarExito('Medicamento eliminado completamente');
            cerrarModalEliminacionVentas();
            cargarMedicamentos();
        } else {
            // Si falla, ofrecer eliminación lógica como alternativa
            mostrarError('No se pudo eliminar completamente. Se recomienda usar eliminación lógica.');
        }
    } catch (error) {
        console.error('Error al eliminar físicamente:', error);
        mostrarError('Error al eliminar el medicamento. Use eliminación lógica.');
    } finally {
        mostrarLoading(false);
    }
}

// Guardar medicamento (crear o actualizar)
async function guardarMedicamento() {
    if (!validarFormulario()) return;
    
    const formData = {
        nombre: document.getElementById('nombre').value.trim(),
        categoria: document.getElementById('categoria').value,
        stock: parseInt(document.getElementById('stock').value),
        precio: parseFloat(document.getElementById('precio').value),
        unidad: document.getElementById('unidad').value || 'unidades',
        descripcion: document.getElementById('descripcion').value.trim() || null
    };
    
    try {
        mostrarLoading(true);
        
        const url = medicamentoEditando ? 
            `/api/inventario/${medicamentoEditando.id}` : 
            '/api/inventario';
        
        const method = medicamentoEditando ? 'PUT' : 'POST';
        
        const response = await fetch(url, {
            method: method,
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(formData)
        });
        
        const data = await response.json();
        
        if (data.success) {
            const mensaje = medicamentoEditando ? 
                'Medicamento actualizado correctamente' : 
                'Medicamento creado correctamente';
            
            mostrarExito(mensaje);
            cerrarModal();
            cargarMedicamentos();
        } else {
            throw new Error(data.message);
        }
    } catch (error) {
        console.error('Error al guardar medicamento:', error);
        mostrarError('Error al guardar el medicamento');
    } finally {
        mostrarLoading(false);
    }
}

// Validar formulario
function validarFormulario() {
    let esValido = true;
    
    // Limpiar errores previos
    document.querySelectorAll('.error-message').forEach(el => el.textContent = '');
    document.querySelectorAll('.form-control').forEach(el => el.classList.remove('error'));
    
    // Validar nombre
    const nombre = document.getElementById('nombre').value.trim();
    if (!nombre) {
        mostrarErrorCampo('nombre', 'El nombre es obligatorio');
        esValido = false;
    } else if (nombre.length < 2) {
        mostrarErrorCampo('nombre', 'El nombre debe tener al menos 2 caracteres');
        esValido = false;
    }
    
    // Validar categoría
    const categoria = document.getElementById('categoria').value;
    if (!categoria) {
        mostrarErrorCampo('categoria', 'La categoría es obligatoria');
        esValido = false;
    }
    
    // Validar stock
    const stock = document.getElementById('stock').value;
    if (!stock || parseInt(stock) < 0) {
        mostrarErrorCampo('stock', 'El stock debe ser un número mayor o igual a 0');
        esValido = false;
    }
    
    // Validar precio
    const precio = document.getElementById('precio').value;
    if (!precio || parseFloat(precio) <= 0) {
        mostrarErrorCampo('precio', 'El precio debe ser mayor a 0');
        esValido = false;
    }
    
    return esValido;
}

// Mostrar error en campo específico
function mostrarErrorCampo(campo, mensaje) {
    const input = document.getElementById(campo);
    const errorDiv = document.getElementById(`error${campo.charAt(0).toUpperCase() + campo.slice(1)}`);
    
    input.classList.add('error');
    if (errorDiv) {
        errorDiv.textContent = mensaje;
    }
}

// Limpiar formulario
function limpiarFormulario() {
    document.getElementById('formMedicamento').reset();
    document.getElementById('medicamentoId').value = '';
    document.getElementById('unidad').value = 'unidades';
    
    // Limpiar errores
    document.querySelectorAll('.error-message').forEach(el => el.textContent = '');
    document.querySelectorAll('.form-control').forEach(el => el.classList.remove('error'));
}

// Cerrar modal
function cerrarModal() {
    document.getElementById('modalMedicamento').style.display = 'none';
    medicamentoEditando = null;
}

// Cerrar modal de confirmación
function cerrarModalConfirmar() {
    document.getElementById('modalConfirmar').style.display = 'none';
    medicamentoEliminar = null;
}

// Exportar a Excel
function exportarExcel() {
    try {
        // Preparar datos para exportar
        const datosExport = medicamentos.map(med => ({
            'ID': med.id,
            'Nombre': med.nombre,
            'Categoría': med.categoria,
            'Descripción': med.descripcion || '',
            'Stock': med.stock,
            'Unidad': med.unidad || 'unidades',
            'Precio': parseFloat(med.precio).toFixed(2),
            'Valor Total': (parseFloat(med.precio) * parseInt(med.stock)).toFixed(2),
            'Estado Stock': med.stock < 20 ? 'Bajo' : med.stock <= 50 ? 'Normal' : 'Alto'
        }));
        
        // Crear libro de trabajo
        const wb = XLSX.utils.book_new();
        const ws = XLSX.utils.json_to_sheet(datosExport);
        
        // Ajustar ancho de columnas
        const colWidths = [
            { wch: 8 },  // ID
            { wch: 25 }, // Nombre
            { wch: 15 }, // Categoría
            { wch: 30 }, // Descripción
            { wch: 10 }, // Stock
            { wch: 12 }, // Unidad
            { wch: 10 }, // Precio
            { wch: 12 }, // Valor Total
            { wch: 12 }  // Estado Stock
        ];
        ws['!cols'] = colWidths;
        
        // Agregar hoja al libro
        XLSX.utils.book_append_sheet(wb, ws, 'Inventario');
        
        // Generar nombre de archivo con fecha
        const fecha = new Date().toISOString().split('T')[0];
        const nombreArchivo = `inventario_${fecha}.xlsx`;
        
        // Descargar archivo
        XLSX.writeFile(wb, nombreArchivo);
        
        mostrarExito('Inventario exportado correctamente');
    } catch (error) {
        console.error('Error al exportar:', error);
        mostrarError('Error al exportar el inventario');
    }
}

// Imprimir inventario
function imprimirInventario() {
    const ventanaImpresion = window.open('', '_blank');
    
    const html = `
        <!DOCTYPE html>
        <html>
        <head>
            <title>Inventario de Medicamentos</title>
            <style>
                body { font-family: Arial, sans-serif; margin: 20px; }
                h1 { color: #333; text-align: center; }
                .info { text-align: center; margin-bottom: 30px; color: #666; }
                table { width: 100%; border-collapse: collapse; margin-top: 20px; }
                th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
                th { background-color: #f2f2f2; font-weight: bold; }
                .stock-bajo { color: #f44336; font-weight: bold; }
                .stock-normal { color: #ff9800; font-weight: bold; }
                .stock-alto { color: #4caf50; font-weight: bold; }
                .total { margin-top: 20px; text-align: right; font-weight: bold; }
            </style>
        </head>
        <body>
            <h1>📦 Inventario de Medicamentos</h1>
            <div class="info">
                <p>Fecha de impresión: ${new Date().toLocaleDateString('es-ES')}</p>
                <p>Total de productos: ${medicamentos.length}</p>
            </div>
            
            <table>
                <thead>
                    <tr>
                        <th>ID</th>
                        <th>Nombre</th>
                        <th>Categoría</th>
                        <th>Stock</th>
                        <th>Unidad</th>
                        <th>Precio</th>
                        <th>Valor Total</th>
                    </tr>
                </thead>
                <tbody>
                    ${medicamentos.map(med => {
                        const stockClass = getStockClass(med.stock);
                        const valorTotal = (parseFloat(med.precio) * parseInt(med.stock)).toFixed(2);
                        
                        return `
                            <tr>
                                <td>#${String(med.id).padStart(4, '0')}</td>
                                <td>${med.nombre}</td>
                                <td>${med.categoria}</td>
                                <td class="${stockClass}">${med.stock}</td>
                                <td>${med.unidad || 'unidades'}</td>
                                <td>S/ ${parseFloat(med.precio).toFixed(2)}</td>
                                <td>S/ ${valorTotal}</td>
                            </tr>
                        `;
                    }).join('')}
                </tbody>
            </table>
            
            <div class="total">
                <p>Valor total del inventario: S/ ${medicamentos.reduce((sum, med) => sum + (parseFloat(med.precio) * parseInt(med.stock)), 0).toFixed(2)}</p>
            </div>
        </body>
        </html>
    `;
    
    ventanaImpresion.document.write(html);
    ventanaImpresion.document.close();
    ventanaImpresion.print();
}

// Mostrar loading
function mostrarLoading(mostrar) {
    const overlay = document.getElementById('loadingOverlay');
    overlay.style.display = mostrar ? 'flex' : 'none';
}

// Mostrar mensaje de éxito
function mostrarExito(mensaje) {
    // Crear toast de éxito
    const toast = document.createElement('div');
    toast.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: var(--success);
        color: white;
        padding: 15px 20px;
        border-radius: 8px;
        box-shadow: 0 4px 15px rgba(0,0,0,0.3);
        z-index: 3000;
        animation: slideInRight 0.3s ease-out;
    `;
    toast.innerHTML = `✅ ${mensaje}`;
    
    document.body.appendChild(toast);
    
    setTimeout(() => {
        toast.remove();
    }, 3000);
}

// Mostrar mensaje de error
function mostrarError(mensaje) {
    // Crear toast de error
    const toast = document.createElement('div');
    toast.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: var(--danger);
        color: white;
        padding: 15px 20px;
        border-radius: 8px;
        box-shadow: 0 4px 15px rgba(0,0,0,0.3);
        z-index: 3000;
        animation: slideInRight 0.3s ease-out;
    `;
    toast.innerHTML = `❌ ${mensaje}`;
    
    document.body.appendChild(toast);
    
    setTimeout(() => {
        toast.remove();
    }, 4000);
}

// Función para agregar al carrito
function agregarAlCarrito(medicamentoId) {
    const medicamento = medicamentos.find(med => med.id === medicamentoId);
    if (!medicamento) {
        mostrarError('Medicamento no encontrado');
        return;
    }

    if (medicamento.stock <= 0) {
        mostrarError('No hay stock disponible para este medicamento');
        return;
    }

    // Guardar en localStorage para que el carrito lo pueda leer
    let carrito = JSON.parse(localStorage.getItem('carrito') || '[]');
    
    // Buscar si el producto ya está en el carrito
    const itemExistente = carrito.find(item => item.id === medicamentoId);
    
    if (itemExistente) {
        if (itemExistente.cantidad >= medicamento.stock) {
            mostrarError(`No se puede agregar más. Stock máximo: ${medicamento.stock}`);
            return;
        }
        itemExistente.cantidad += 1;
    } else {
        carrito.push({
            id: medicamento.id,
            nombre: medicamento.nombre,
            categoria: medicamento.categoria,
            precio: parseFloat(medicamento.precio),
            cantidad: 1,
            stock: medicamento.stock
        });
    }

    localStorage.setItem('carrito', JSON.stringify(carrito));
    mostrarExito(`${medicamento.nombre} agregado al carrito`);
}

// Agregar animación CSS
const style = document.createElement('style');
style.textContent = `
    @keyframes slideInRight {
        from {
            transform: translateX(100%);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
    
    .btn-cart {
        background: var(--success);
        color: white;
    }

    .btn-cart:hover {
        background: #388e3c;
        transform: translateY(-1px);
    }
    
    .btn-cart:disabled {
        background: #ccc;
        cursor: not-allowed;
        transform: none;
    }
`;
document.head.appendChild(style);
