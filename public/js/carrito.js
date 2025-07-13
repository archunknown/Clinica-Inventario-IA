// Variables globales del carrito
let carrito = [];
let productos = [];
let usuario = null;

// Elementos del DOM
const carritoItems = document.getElementById('carritoItems');
const carritoVacio = document.getElementById('carritoVacio');
const contadorItems = document.getElementById('contadorItems');
const subtotalElement = document.getElementById('subtotal');
const descuentoElement = document.getElementById('descuento');
const totalElement = document.getElementById('total');
const totalProcesar = document.getElementById('totalProcesar');
const btnProcesar = document.getElementById('btnProcesar');
const btnLimpiar = document.getElementById('btnLimpiar');
const buscadorProductos = document.getElementById('buscadorProductos');
const buscarInput = document.getElementById('buscarInput');
const productosSugeridos = document.getElementById('productosSugeridos');
const loadingOverlay = document.getElementById('loadingOverlay');

// Inicialización
document.addEventListener('DOMContentLoaded', function() {
    cargarUsuario();
    cargarProductos();
    cargarCarritoDesdeStorage();
    actualizarInterfaz();
    
    // Event listeners
    buscarInput.addEventListener('input', buscarProductos);
});

// Cargar datos del usuario desde localStorage
function cargarUsuario() {
    const userData = localStorage.getItem('user');
    if (userData) {
        usuario = JSON.parse(userData);
    } else {
        // Redirigir al login si no hay usuario
        window.location.href = '/views/login.html';
    }
}

// Cargar productos desde la API
async function cargarProductos() {
    try {
        const response = await fetch('/api/inventario/medicamentos');
        const data = await response.json();
        
        if (data.success) {
            productos = data.data;
        } else {
            mostrarError('Error al cargar productos');
        }
    } catch (error) {
        console.error('Error:', error);
        mostrarError('Error de conexión al cargar productos');
    }
}

// Cargar carrito desde localStorage
function cargarCarritoDesdeStorage() {
    const carritoGuardado = localStorage.getItem('carrito');
    if (carritoGuardado) {
        carrito = JSON.parse(carritoGuardado);
    }
}

// Guardar carrito en localStorage
function guardarCarritoEnStorage() {
    localStorage.setItem('carrito', JSON.stringify(carrito));
}

// Agregar producto al carrito
function agregarAlCarrito(productoId, cantidad = 1) {
    const producto = productos.find(p => p.id === productoId);
    if (!producto) {
        mostrarError('Producto no encontrado');
        return;
    }

    // Verificar stock disponible
    if (producto.stock < cantidad) {
        mostrarError(`Stock insuficiente. Solo hay ${producto.stock} unidades disponibles`);
        return;
    }

    // Buscar si el producto ya está en el carrito
    const itemExistente = carrito.find(item => item.id === productoId);
    
    if (itemExistente) {
        const nuevaCantidad = itemExistente.cantidad + cantidad;
        if (nuevaCantidad > producto.stock) {
            mostrarError(`No se puede agregar más. Stock máximo: ${producto.stock}`);
            return;
        }
        itemExistente.cantidad = nuevaCantidad;
    } else {
        carrito.push({
            id: producto.id,
            nombre: producto.nombre,
            categoria: producto.categoria,
            precio: parseFloat(producto.precio),
            cantidad: cantidad,
            stock: producto.stock
        });
    }

    guardarCarritoEnStorage();
    actualizarInterfaz();
    mostrarExito(`${producto.nombre} agregado al carrito`);
}

// Actualizar cantidad de un item
function actualizarCantidad(productoId, nuevaCantidad) {
    const item = carrito.find(item => item.id === productoId);
    if (!item) return;

    if (nuevaCantidad <= 0) {
        eliminarDelCarrito(productoId);
        return;
    }

    if (nuevaCantidad > item.stock) {
        mostrarError(`Stock máximo disponible: ${item.stock}`);
        return;
    }

    item.cantidad = nuevaCantidad;
    guardarCarritoEnStorage();
    actualizarInterfaz();
}

// Eliminar producto del carrito
function eliminarDelCarrito(productoId) {
    const index = carrito.findIndex(item => item.id === productoId);
    if (index > -1) {
        const item = carrito[index];
        carrito.splice(index, 1);
        guardarCarritoEnStorage();
        actualizarInterfaz();
        mostrarExito(`${item.nombre} eliminado del carrito`);
    }
}

// Limpiar todo el carrito
function limpiarCarrito() {
    if (carrito.length === 0) return;
    
    if (confirm('¿Estás seguro de que quieres limpiar todo el carrito?')) {
        carrito = [];
        guardarCarritoEnStorage();
        actualizarInterfaz();
        mostrarExito('Carrito limpiado');
    }
}

// Actualizar toda la interfaz
function actualizarInterfaz() {
    actualizarContadorItems();
    actualizarResumen();
    renderizarCarrito();
    actualizarBotones();
}

// Actualizar contador de items
function actualizarContadorItems() {
    const totalItems = carrito.reduce((sum, item) => sum + item.cantidad, 0);
    contadorItems.textContent = `${totalItems} item${totalItems !== 1 ? 's' : ''}`;
}

// Actualizar resumen de precios
function actualizarResumen() {
    const subtotal = carrito.reduce((sum, item) => sum + (item.precio * item.cantidad), 0);
    const descuento = 0; // Por ahora sin descuentos
    const total = subtotal - descuento;

    subtotalElement.textContent = `$${subtotal.toFixed(2)}`;
    descuentoElement.textContent = `$${descuento.toFixed(2)}`;
    totalElement.textContent = `$${total.toFixed(2)}`;
    totalProcesar.textContent = `$${total.toFixed(2)}`;
}

// Renderizar items del carrito
function renderizarCarrito() {
    if (carrito.length === 0) {
        carritoVacio.style.display = 'block';
        carritoItems.innerHTML = '';
        carritoItems.appendChild(carritoVacio);
        return;
    }

    carritoVacio.style.display = 'none';
    carritoItems.innerHTML = '';

    carrito.forEach(item => {
        const itemElement = document.createElement('div');
        itemElement.className = 'carrito-item fade-in';
        itemElement.innerHTML = `
            <div class="item-imagen">💊</div>
            <div class="item-info">
                <div class="item-nombre">${item.nombre}</div>
                <div class="item-categoria">${item.categoria}</div>
                <div class="item-precio">${item.precio.toFixed(2)} c/u</div>
            </div>
            <div class="cantidad-controls">
                <button class="cantidad-btn" onclick="actualizarCantidad(${item.id}, ${item.cantidad - 1})">-</button>
                <input type="number" class="cantidad-input" value="${item.cantidad}" 
                       onchange="actualizarCantidad(${item.id}, parseInt(this.value))" 
                       min="1" max="${item.stock}">
                <button class="cantidad-btn" onclick="actualizarCantidad(${item.id}, ${item.cantidad + 1})">+</button>
            </div>
            <div class="item-subtotal">$${(item.precio * item.cantidad).toFixed(2)}</div>
            <button class="item-eliminar" onclick="eliminarDelCarrito(${item.id})" title="Eliminar producto">
                ✕
            </button>
        `;
        carritoItems.appendChild(itemElement);
    });
}

// Actualizar estado de botones
function actualizarBotones() {
    const hayItems = carrito.length > 0;
    btnProcesar.disabled = !hayItems;
    btnLimpiar.style.display = hayItems ? 'block' : 'none';
}

// Mostrar/ocultar buscador de productos
function mostrarBuscador() {
    const isVisible = buscadorProductos.style.display !== 'none';
    buscadorProductos.style.display = isVisible ? 'none' : 'block';
    if (!isVisible) {
        buscarInput.focus();
        mostrarTodosLosProductos();
    }
}

// Buscar productos
function buscarProductos() {
    const termino = buscarInput.value.toLowerCase().trim();
    
    if (termino === '') {
        mostrarTodosLosProductos();
        return;
    }

    const productosFiltrados = productos.filter(producto => 
        producto.nombre.toLowerCase().includes(termino) ||
        producto.categoria.toLowerCase().includes(termino) ||
        (producto.descripcion && producto.descripcion.toLowerCase().includes(termino))
    );

    renderizarProductosSugeridos(productosFiltrados);
}

// Mostrar todos los productos
function mostrarTodosLosProductos() {
    renderizarProductosSugeridos(productos.slice(0, 20)); // Mostrar solo los primeros 20
}

// Renderizar productos sugeridos
function renderizarProductosSugeridos(productosParaMostrar) {
    productosSugeridos.innerHTML = '';

    if (productosParaMostrar.length === 0) {
        productosSugeridos.innerHTML = '<p style="text-align: center; color: var(--text-muted); padding: 20px;">No se encontraron productos</p>';
        return;
    }

    productosParaMostrar.forEach(producto => {
        const productoElement = document.createElement('div');
        productoElement.className = 'producto-sugerido';
        productoElement.onclick = () => agregarAlCarrito(producto.id);
        
        const stockClass = producto.stock < 10 ? 'color: var(--danger)' : 
                          producto.stock < 20 ? 'color: var(--warning)' : 
                          'color: var(--success)';

        productoElement.innerHTML = `
            <div class="producto-nombre">${producto.nombre}</div>
            <div class="producto-precio">$${parseFloat(producto.precio).toFixed(2)}</div>
            <div class="producto-stock" style="${stockClass}">Stock: ${producto.stock}</div>
        `;
        
        productosSugeridos.appendChild(productoElement);
    });
}

// Procesar venta - Mostrar modal de confirmación
async function procesarVenta() {
    if (carrito.length === 0) {
        mostrarError('El carrito está vacío');
        return;
    }

    if (!usuario) {
        mostrarError('Usuario no identificado');
        return;
    }

    // Mostrar modal de confirmación
    mostrarModalConfirmacion();
}

// Mostrar modal de confirmación de pedido
function mostrarModalConfirmacion() {
    const modal = document.createElement('div');
    modal.className = 'modal-overlay';
    modal.id = 'modalConfirmacion';
    
    const subtotal = carrito.reduce((sum, item) => sum + (item.precio * item.cantidad), 0);
    const igv = subtotal * 0.18;
    const total = subtotal + igv;
    
    const itemsHTML = carrito.map(item => `
        <div class="modal-item">
            <div class="modal-item-info">
                <span class="modal-item-nombre">${item.nombre}</span>
                <span class="modal-item-categoria">${item.categoria}</span>
            </div>
            <div class="modal-item-cantidad">x${item.cantidad}</div>
            <div class="modal-item-precio">$${(item.precio * item.cantidad).toFixed(2)}</div>
        </div>
    `).join('');

    modal.innerHTML = `
        <div class="modal-content">
            <div class="modal-header">
                <h2>🛒 Confirmar Pedido</h2>
                <button class="modal-close" onclick="cerrarModalConfirmacion()">✕</button>
            </div>
            
            <div class="modal-body">
                <div class="modal-section">
                    <h3>👤 Datos del Cliente</h3>
                    <div class="cliente-form">
                        <div class="form-row">
                            <div class="form-group">
                                <label for="cliente-dni">DNI:</label>
                                <input type="text" id="cliente-dni" class="form-control" placeholder="12345678" maxlength="8" pattern="[0-9]{8}">
                            </div>
                            <div class="form-group">
                                <label for="cliente-nombre">Nombres:</label>
                                <input type="text" id="cliente-nombre" class="form-control" placeholder="Juan Carlos">
                            </div>
                        </div>
                        <div class="form-row">
                            <div class="form-group">
                                <label for="cliente-apellido-paterno">Apellido Paterno:</label>
                                <input type="text" id="cliente-apellido-paterno" class="form-control" placeholder="García">
                            </div>
                            <div class="form-group">
                                <label for="cliente-apellido-materno">Apellido Materno:</label>
                                <input type="text" id="cliente-apellido-materno" class="form-control" placeholder="López">
                            </div>
                        </div>
                        <div class="form-note">
                            <small>* Los datos del cliente son opcionales. Si el cliente ya existe, se actualizarán sus datos.</small>
                        </div>
                    </div>
                </div>
                
                <div class="modal-section">
                    <h3>📋 Resumen del Pedido</h3>
                    <div class="modal-items">
                        ${itemsHTML}
                    </div>
                </div>
                
                <div class="modal-section">
                    <h3>💰 Detalle de Pago</h3>
                    <div class="modal-totales">
                        <div class="modal-total-item">
                            <span>Subtotal:</span>
                            <span>$${subtotal.toFixed(2)}</span>
                        </div>
                        <div class="modal-total-item">
                            <span>IGV (18%):</span>
                            <span>$${igv.toFixed(2)}</span>
                        </div>
                        <div class="modal-total-item modal-total-final">
                            <span>Total a Pagar:</span>
                            <span>$${total.toFixed(2)}</span>
                        </div>
                    </div>
                </div>
                
                <div class="modal-section">
                    <h3>ℹ️ Información Adicional</h3>
                    <div class="modal-info">
                        <p><strong>Atendido por:</strong> ${usuario.username}</p>
                        <p><strong>Fecha:</strong> ${new Date().toLocaleDateString('es-ES')}</p>
                        <p><strong>Hora:</strong> ${new Date().toLocaleTimeString('es-ES')}</p>
                        <p><strong>Método de pago:</strong> Efectivo</p>
                    </div>
                </div>
            </div>
            
            <div class="modal-footer">
                <button class="btn-modal-cancelar" onclick="cerrarModalConfirmacion()">
                    ❌ Cancelar
                </button>
                <button class="btn-modal-confirmar" onclick="confirmarVenta()">
                    ✅ Confirmar Venta
                </button>
            </div>
        </div>
    `;

    // Agregar estilos del modal
    const estilosModal = `
        <style>
        .modal-overlay {
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(6, 6, 6, 0.9);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 2000;
            animation: fadeIn 0.3s ease-out;
        }
        
        .modal-content {
            background: var(--color2);
            border-radius: var(--border-radius-lg);
            box-shadow: var(--shadow-lg);
            width: 90%;
            max-width: 600px;
            max-height: 90vh;
            overflow-y: auto;
            animation: slideIn 0.3s ease-out;
        }
        
        .modal-header {
            padding: 25px;
            border-bottom: 1px solid var(--color3);
            display: flex;
            justify-content: space-between;
            align-items: center;
        }
        
        .modal-header h2 {
            color: var(--text-light);
            margin: 0;
            font-size: 1.5rem;
        }
        
        .modal-close {
            background: none;
            border: none;
            color: var(--text-muted);
            font-size: 1.5rem;
            cursor: pointer;
            padding: 5px;
            border-radius: 50%;
            width: 35px;
            height: 35px;
            display: flex;
            align-items: center;
            justify-content: center;
            transition: var(--transition);
        }
        
        .modal-close:hover {
            background: var(--color3);
            color: var(--text-light);
        }
        
        .modal-body {
            padding: 25px;
        }
        
        .modal-section {
            margin-bottom: 25px;
        }
        
        .modal-section h3 {
            color: var(--color5);
            margin-bottom: 15px;
            font-size: 1.1rem;
            border-bottom: 2px solid var(--accent);
            padding-bottom: 5px;
        }
        
        .modal-items {
            background: var(--color3);
            border-radius: var(--border-radius);
            padding: 15px;
        }
        
        .modal-item {
            display: grid;
            grid-template-columns: 1fr auto auto;
            gap: 15px;
            align-items: center;
            padding: 12px 0;
            border-bottom: 1px solid var(--color4);
        }
        
        .modal-item:last-child {
            border-bottom: none;
        }
        
        .modal-item-info {
            display: flex;
            flex-direction: column;
            gap: 3px;
        }
        
        .modal-item-nombre {
            font-weight: 600;
            color: var(--text-light);
        }
        
        .modal-item-categoria {
            font-size: 0.85rem;
            color: var(--text-muted);
        }
        
        .modal-item-cantidad {
            background: var(--color4);
            padding: 4px 12px;
            border-radius: 15px;
            font-size: 0.9rem;
            font-weight: 600;
            color: var(--text-light);
        }
        
        .modal-item-precio {
            font-weight: 700;
            color: var(--accent);
            font-size: 1.1rem;
        }
        
        .modal-totales {
            background: var(--color3);
            border-radius: var(--border-radius);
            padding: 20px;
        }
        
        .modal-total-item {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 8px 0;
            color: var(--text-light);
        }
        
        .modal-total-final {
            border-top: 2px solid var(--color4);
            margin-top: 10px;
            padding-top: 15px;
            font-size: 1.2rem;
            font-weight: 700;
            color: var(--accent);
        }
        
        .modal-info {
            background: var(--color3);
            border-radius: var(--border-radius);
            padding: 15px;
            color: var(--text-light);
        }
        
        .modal-info p {
            margin-bottom: 8px;
            display: flex;
            justify-content: space-between;
        }
        
        .modal-info p:last-child {
            margin-bottom: 0;
        }
        
        .modal-footer {
            padding: 25px;
            border-top: 1px solid var(--color3);
            display: flex;
            gap: 15px;
            justify-content: flex-end;
        }
        
        .btn-modal-cancelar {
            padding: 12px 25px;
            background: transparent;
            border: 2px solid var(--color4);
            border-radius: var(--border-radius);
            color: var(--text-muted);
            cursor: pointer;
            transition: var(--transition);
            font-weight: 600;
        }
        
        .btn-modal-cancelar:hover {
            border-color: var(--danger);
            color: var(--danger);
        }
        
        .btn-modal-confirmar {
            padding: 12px 25px;
            background: var(--accent);
            border: none;
            border-radius: var(--border-radius);
            color: white;
            cursor: pointer;
            transition: var(--transition);
            font-weight: 600;
        }
        
        .btn-modal-confirmar:hover {
            background: var(--accent-hover);
            transform: translateY(-2px);
        }
        
        .cliente-form {
            background: var(--color3);
            border-radius: var(--border-radius);
            padding: 20px;
        }
        
        .form-row {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 15px;
            margin-bottom: 15px;
        }
        
        .form-group {
            display: flex;
            flex-direction: column;
        }
        
        .form-group label {
            color: var(--text-muted);
            font-size: 0.9rem;
            margin-bottom: 5px;
            font-weight: 600;
        }
        
        .form-control {
            padding: 10px;
            background: var(--color4);
            border: 1px solid var(--color5);
            border-radius: var(--border-radius-sm);
            color: var(--text-light);
            font-size: 1rem;
            transition: var(--transition);
        }
        
        .form-control:focus {
            outline: none;
            background: var(--color5);
            border-color: var(--accent);
        }
        
        .form-note {
            margin-top: 10px;
            color: var(--text-muted);
            font-size: 0.85rem;
            text-align: center;
        }
        
        @keyframes slideIn {
            from {
                transform: translateY(-50px);
                opacity: 0;
            }
            to {
                transform: translateY(0);
                opacity: 1;
            }
        }
        
        @media (max-width: 768px) {
            .modal-content {
                width: 95%;
                margin: 20px;
            }
            
            .modal-item {
                grid-template-columns: 1fr;
                text-align: center;
                gap: 8px;
            }
            
            .modal-footer {
                flex-direction: column;
            }
        }
        </style>
    `;

    document.head.insertAdjacentHTML('beforeend', estilosModal);
    document.body.appendChild(modal);
}

// Cerrar modal de confirmación
function cerrarModalConfirmacion() {
    const modal = document.getElementById('modalConfirmacion');
    if (modal) {
        modal.remove();
    }
}

// Confirmar venta y generar PDF
async function confirmarVenta() {
    // Obtener datos del cliente del modal antes de cerrarlo
    const clienteDni = document.getElementById('cliente-dni').value.trim();
    const clienteNombre = document.getElementById('cliente-nombre').value.trim();
    const clienteApellidoPaterno = document.getElementById('cliente-apellido-paterno').value.trim();
    const clienteApellidoMaterno = document.getElementById('cliente-apellido-materno').value.trim();
    
    // Cerrar modal
    cerrarModalConfirmacion();
    
    // Mostrar loading
    loadingOverlay.style.display = 'flex';

    try {
        // Preparar datos de la venta
        const ventaData = {
            usuario_id: usuario.id,
            items: carrito.map(item => ({
                medicamento_id: item.id,
                cantidad: item.cantidad
            }))
        };

        // Agregar datos del cliente si se proporcionaron
        if (clienteDni || clienteNombre || clienteApellidoPaterno || clienteApellidoMaterno) {
            ventaData.cliente = {
                dni: clienteDni,
                nombre: clienteNombre,
                apellido_paterno: clienteApellidoPaterno,
                apellido_materno: clienteApellidoMaterno
            };
            console.log('Datos del cliente a enviar:', ventaData.cliente); // LOG DE DEPURACIÓN
        }

        console.log('Datos completos de la venta:', ventaData); // LOG DE DEPURACIÓN

        // Enviar venta al servidor
        const response = await fetch('/api/ventas/crear', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(ventaData)
        });

        const data = await response.json();

        if (data.success) {
            // Venta exitosa
            mostrarExito(`Venta procesada exitosamente. ID: ${data.data.venta_id}`);
            
            // Limpiar carrito
            carrito = [];
            guardarCarritoEnStorage();
            actualizarInterfaz();
            
            // Recargar productos para actualizar stock
            await cargarProductos();
            
            // Generar y descargar PDF automáticamente
            setTimeout(async () => {
                try {
                    await descargarBoletaPDF(data.data.venta_id);
                    mostrarExito('Boleta PDF generada y descargada exitosamente');
                } catch (error) {
                    console.error('Error al generar PDF:', error);
                    mostrarError('Error al generar la boleta PDF');
                }
            }, 1000);
            
        } else {
            mostrarError(data.message || 'Error al procesar la venta');
            
            // Si hay errores de stock, mostrarlos
            if (data.errores) {
                data.errores.forEach(error => {
                    mostrarError(`${error.nombre}: ${error.error}`);
                });
            }
        }

    } catch (error) {
        console.error('Error:', error);
        mostrarError('Error de conexión al procesar la venta');
    } finally {
        loadingOverlay.style.display = 'none';
    }
}

// Descargar boleta PDF
async function descargarBoletaPDF(ventaId) {
    try {
        const response = await fetch(`/api/ventas/${ventaId}/pdf`);
        
        if (!response.ok) {
            throw new Error('Error al generar PDF');
        }

        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.style.display = 'none';
        a.href = url;
        a.download = `boleta-${String(ventaId).padStart(6, '0')}.pdf`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        
    } catch (error) {
        console.error('Error al descargar PDF:', error);
        throw error;
    }
}

// Ir al inventario
function irAInventario() {
    window.location.href = '/views/inventario.html';
}

// Funciones de notificación
function mostrarExito(mensaje) {
    mostrarNotificacion(mensaje, 'success');
}

function mostrarError(mensaje) {
    mostrarNotificacion(mensaje, 'error');
}

function mostrarNotificacion(mensaje, tipo) {
    const notificacion = document.createElement('div');
    notificacion.className = `notificacion ${tipo}`;
    notificacion.textContent = mensaje;
    
    const estilos = tipo === 'success' ? 
        `background: var(--success); color: white;` :
        `background: var(--danger); color: white;`;
    
    notificacion.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 15px 25px;
        ${estilos}
        border-radius: 8px;
        box-shadow: var(--shadow-lg);
        z-index: 1001;
        animation: slideIn 0.3s ease-out;
    `;
    
    document.body.appendChild(notificacion);
    
    setTimeout(() => {
        notificacion.style.animation = 'slideOut 0.3s ease-out forwards';
        setTimeout(() => notificacion.remove(), 300);
    }, 3000);
}

// Función global para agregar productos desde otras páginas
window.agregarProductoAlCarrito = function(productoId, cantidad = 1) {
    agregarAlCarrito(productoId, cantidad);
};

// Exponer funciones globales necesarias
window.agregarAlCarrito = agregarAlCarrito;
window.actualizarCantidad = actualizarCantidad;
window.eliminarDelCarrito = eliminarDelCarrito;
window.limpiarCarrito = limpiarCarrito;
window.procesarVenta = procesarVenta;
window.mostrarBuscador = mostrarBuscador;
window.irAInventario = irAInventario;
window.cerrarModalConfirmacion = cerrarModalConfirmacion;
window.confirmarVenta = confirmarVenta;
