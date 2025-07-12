// Variables globales
let medicamentos = [];
let medicamentosFiltrados = [];

// Elementos del DOM
const searchInput = document.getElementById('searchInput');
const filterCategory = document.getElementById('filterCategory');
const filterStock = document.getElementById('filterStock');
const medicamentosTableBody = document.getElementById('medicamentosTableBody');
const totalProductos = document.getElementById('totalProductos');
const totalUnidades = document.getElementById('totalUnidades');
const valorTotal = document.getElementById('valorTotal');
const stockBajo = document.getElementById('stockBajo');

// Función para cargar medicamentos
async function cargarMedicamentos() {
    try {
        const response = await fetch('http://localhost:3000/api/inventario/medicamentos');
        const data = await response.json();
        
        if (data.success) {
            medicamentos = data.data;
            medicamentosFiltrados = [...medicamentos];
            renderizarTabla();
            actualizarEstadisticas();
            actualizarFiltrosCategorias();
        } else {
            mostrarError('Error al cargar los medicamentos');
        }
    } catch (error) {
        console.error('Error:', error);
        mostrarError('Error de conexión con el servidor');
    }
}

// Función para renderizar la tabla
function renderizarTabla() {
    medicamentosTableBody.innerHTML = '';
    
    if (medicamentosFiltrados.length === 0) {
        medicamentosTableBody.innerHTML = `
            <tr>
                <td colspan="7" class="text-center p-4">No se encontraron medicamentos</td>
            </tr>
        `;
        return;
    }
    
    medicamentosFiltrados.forEach(medicamento => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${medicamento.id}</td>
            <td>${medicamento.nombre}</td>
            <td>
                <span class="badge badge-info">${medicamento.categoria}</span>
            </td>
            <td>${medicamento.descripcion || 'Sin descripción'}</td>
            <td>
                <span class="badge ${getStockBadgeClass(medicamento.stock)}">
                    ${medicamento.stock} ${medicamento.unidad || 'unidades'}
                </span>
            </td>
            <td>$${parseFloat(medicamento.precio).toFixed(2)}</td>
            <td>
                <button class="btn btn-sm" onclick="verDetalles(${medicamento.id})" title="Ver detalles">
                    👁️
                </button>
                <button class="btn btn-sm btn-primary" onclick="agregarAlCarrito(${medicamento.id})" title="Agregar al carrito">
                    🛒
                </button>
            </td>
        `;
        medicamentosTableBody.appendChild(row);
    });
}

// Función para determinar la clase del badge según el stock
function getStockBadgeClass(stock) {
    if (stock < 10) return 'badge-danger';
    if (stock < 20) return 'badge-warning';
    return 'badge-success';
}

// Función para actualizar estadísticas
async function actualizarEstadisticas() {
    try {
        const response = await fetch('http://localhost:3000/api/inventario/stats');
        const data = await response.json();
        
        if (data.success) {
            const stats = data.data;
            totalProductos.textContent = stats.total_productos || 0;
            totalUnidades.textContent = stats.total_unidades || 0;
            valorTotal.textContent = `$${parseFloat(stats.valor_total || 0).toFixed(2)}`;
            stockBajo.textContent = stats.productos_stock_bajo || 0;
        }
    } catch (error) {
        console.error('Error al cargar estadísticas:', error);
    }
}

// Función para actualizar filtros de categorías
function actualizarFiltrosCategorias() {
    const categorias = [...new Set(medicamentos.map(m => m.categoria))];
    filterCategory.innerHTML = '<option value="">Todas las categorías</option>';
    
    categorias.forEach(categoria => {
        const option = document.createElement('option');
        option.value = categoria;
        option.textContent = categoria;
        filterCategory.appendChild(option);
    });
}

// Función para aplicar filtros
function aplicarFiltros() {
    const searchTerm = searchInput.value.toLowerCase();
    const selectedCategory = filterCategory.value;
    const selectedStock = filterStock.value;
    
    medicamentosFiltrados = medicamentos.filter(medicamento => {
        // Filtro de búsqueda
        const matchSearch = medicamento.nombre.toLowerCase().includes(searchTerm) ||
                          medicamento.descripcion?.toLowerCase().includes(searchTerm) ||
                          medicamento.categoria.toLowerCase().includes(searchTerm);
        
        // Filtro de categoría
        const matchCategory = !selectedCategory || medicamento.categoria === selectedCategory;
        
        // Filtro de stock
        let matchStock = true;
        if (selectedStock === 'bajo') {
            matchStock = medicamento.stock < 20;
        } else if (selectedStock === 'normal') {
            matchStock = medicamento.stock >= 20 && medicamento.stock < 50;
        } else if (selectedStock === 'alto') {
            matchStock = medicamento.stock >= 50;
        }
        
        return matchSearch && matchCategory && matchStock;
    });
    
    renderizarTabla();
}

// Función para ver detalles de un medicamento
function verDetalles(id) {
    const medicamento = medicamentos.find(m => m.id === id);
    if (medicamento) {
        alert(`
Detalles del Medicamento:
------------------------
ID: ${medicamento.id}
Nombre: ${medicamento.nombre}
Categoría: ${medicamento.categoria}
Descripción: ${medicamento.descripcion || 'Sin descripción'}
Stock: ${medicamento.stock} ${medicamento.unidad || 'unidades'}
Precio: $${parseFloat(medicamento.precio).toFixed(2)}
        `);
    }
}

// Función para mostrar errores
function mostrarError(mensaje) {
    const alertDiv = document.createElement('div');
    alertDiv.className = 'alert alert-danger';
    alertDiv.textContent = mensaje;
    alertDiv.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 15px 25px;
        background: var(--danger);
        color: white;
        border-radius: 8px;
        box-shadow: var(--shadow-lg);
        z-index: 1000;
    `;
    
    document.body.appendChild(alertDiv);
    
    setTimeout(() => {
        alertDiv.remove();
    }, 5000);
}

// Event listeners
document.addEventListener('DOMContentLoaded', () => {
    cargarMedicamentos();
    
    // Listeners para filtros
    searchInput.addEventListener('input', aplicarFiltros);
    filterCategory.addEventListener('change', aplicarFiltros);
    filterStock.addEventListener('change', aplicarFiltros);
    
    // Recargar datos cada 30 segundos
    setInterval(() => {
        cargarMedicamentos();
    }, 30000);
});

// Función para exportar a CSV (futura implementación)
function exportarCSV() {
    alert('Función de exportación en desarrollo');
}

// Función para imprimir inventario (futura implementación)
function imprimirInventario() {
    window.print();
}

// Función para agregar producto al carrito
function agregarAlCarrito(productoId) {
    const medicamento = medicamentos.find(m => m.id === productoId);
    if (!medicamento) {
        mostrarError('Medicamento no encontrado');
        return;
    }

    if (medicamento.stock <= 0) {
        mostrarError('Producto sin stock disponible');
        return;
    }

    // Obtener carrito actual del localStorage
    let carrito = [];
    const carritoGuardado = localStorage.getItem('carrito');
    if (carritoGuardado) {
        carrito = JSON.parse(carritoGuardado);
    }

    // Verificar si el producto ya está en el carrito
    const itemExistente = carrito.find(item => item.id === productoId);
    
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

    // Guardar carrito actualizado
    localStorage.setItem('carrito', JSON.stringify(carrito));
    
    // Mostrar mensaje de éxito
    mostrarExito(`${medicamento.nombre} agregado al carrito`);
}

// Función para mostrar mensajes de éxito
function mostrarExito(mensaje) {
    const alertDiv = document.createElement('div');
    alertDiv.className = 'alert alert-success';
    alertDiv.textContent = mensaje;
    alertDiv.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 15px 25px;
        background: var(--success);
        color: white;
        border-radius: 8px;
        box-shadow: var(--shadow-lg);
        z-index: 1000;
    `;
    
    document.body.appendChild(alertDiv);
    
    setTimeout(() => {
        alertDiv.remove();
    }, 3000);
}
