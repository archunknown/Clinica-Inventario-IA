// Variables globales
let statsData = {};
let actividadReciente = [];
let stockBajo = [];

// Inicializar dashboard
document.addEventListener('DOMContentLoaded', function() {
    cargarDatosDashboard();
    configurarEventListeners();
    
    // Actualizar datos cada 5 minutos
    setInterval(cargarDatosDashboard, 5 * 60 * 1000);
});

// Configurar event listeners
function configurarEventListeners() {
    // Botón de nueva venta
    const btnNuevaVenta = document.querySelector('.header-btn.primary');
    if (btnNuevaVenta) {
        btnNuevaVenta.addEventListener('click', () => {
            window.location.href = 'carrito.html';
        });
    }

    // Botón de notificaciones
    const btnNotificaciones = document.querySelector('.header-btn:nth-child(2)');
    if (btnNotificaciones) {
        btnNotificaciones.addEventListener('click', mostrarNotificaciones);
    }

    // Botón de ver stock bajo
    const alertStockBajo = document.querySelector('.stat-card:last-child');
    if (alertStockBajo) {
        alertStockBajo.addEventListener('click', mostrarStockBajo);
        alertStockBajo.style.cursor = 'pointer';
    }
}

// Cargar todos los datos del dashboard
async function cargarDatosDashboard() {
    try {
        mostrarLoading(true);
        
        // Cargar estadísticas principales
        await cargarEstadisticas();
        
        // Cargar actividad reciente
        await cargarActividadReciente();
        
        // Cargar productos con stock bajo
        await cargarStockBajo();
        
        // Cargar productos más vendidos
        await cargarTopProductos();
        
        mostrarLoading(false);
        
    } catch (error) {
        console.error('Error al cargar datos del dashboard:', error);
        mostrarError('Error al cargar los datos del dashboard');
        mostrarLoading(false);
    }
}

// Cargar estadísticas principales
async function cargarEstadisticas() {
    try {
        const response = await fetch('/api/dashboard/stats');
        const data = await response.json();
        
        if (data.success) {
            statsData = data.data;
            actualizarEstadisticas();
        } else {
            throw new Error(data.message);
        }
    } catch (error) {
        console.error('Error al cargar estadísticas:', error);
        throw error;
    }
}

// Actualizar las estadísticas en el DOM
function actualizarEstadisticas() {
    // Total de unidades en stock
    const totalUnidadesEl = document.querySelector('.stat-card:nth-child(1) .stat-value');
    if (totalUnidadesEl) {
        totalUnidadesEl.textContent = statsData.totalUnidades.toLocaleString();
    }
    
    const labelUnidadesEl = document.querySelector('.stat-card:nth-child(1) .stat-label');
    if (labelUnidadesEl) {
        labelUnidadesEl.textContent = `${statsData.totalProductos} productos únicos`;
    }

    // Ventas del mes
    const ventasMesEl = document.querySelector('.stat-card:nth-child(2) .stat-value');
    if (ventasMesEl) {
        ventasMesEl.textContent = `S/ ${statsData.totalVentasMes.toFixed(2)}`;
    }
    
    const labelVentasMesEl = document.querySelector('.stat-card:nth-child(2) .stat-label');
    if (labelVentasMesEl) {
        labelVentasMesEl.textContent = `${statsData.numVentasMes} ventas este mes`;
    }
    
    const trendVentasEl = document.querySelector('.stat-card:nth-child(2) .stat-trend span:last-child');
    if (trendVentasEl) {
        const porcentaje = parseFloat(statsData.porcentajeCambioVentas);
        const isPositive = porcentaje >= 0;
        trendVentasEl.textContent = `${Math.abs(porcentaje)}% vs mes anterior`;
        trendVentasEl.parentElement.className = `stat-trend ${isPositive ? 'trend-up' : 'trend-down'}`;
        trendVentasEl.previousElementSibling.textContent = isPositive ? '↑' : '↓';
    }

    // Productos vendidos hoy
    const productosHoyEl = document.querySelector('.stat-card:nth-child(3) .stat-value');
    if (productosHoyEl) {
        productosHoyEl.textContent = statsData.productosVendidosHoy.toLocaleString();
    }
    
    const labelProductosHoyEl = document.querySelector('.stat-card:nth-child(3) .stat-label');
    if (labelProductosHoyEl) {
        labelProductosHoyEl.textContent = `${statsData.numVentasHoy} ventas hoy`;
    }

    // Ventas de hoy (cambiar trend por valor de ventas)
    const trendProductosHoyEl = document.querySelector('.stat-card:nth-child(3) .stat-trend');
    if (trendProductosHoyEl) {
        trendProductosHoyEl.innerHTML = `
            <span style="color: var(--success);">💰</span>
            <span style="color: var(--success);">S/ ${statsData.totalVentasHoy.toFixed(2)} vendido hoy</span>
        `;
    }

    // Stock bajo
    const stockBajoEl = document.querySelector('.stat-card:nth-child(4) .stat-value');
    if (stockBajoEl) {
        stockBajoEl.textContent = statsData.stockBajo.toLocaleString();
    }
    
    // Cambiar color del card de stock bajo si hay alertas
    const stockBajoCard = document.querySelector('.stat-card:nth-child(4)');
    if (stockBajoCard && statsData.stockBajo > 0) {
        stockBajoCard.style.borderColor = 'var(--warning)';
        stockBajoCard.style.boxShadow = '0 4px 15px rgba(255, 152, 0, 0.3)';
    } else if (stockBajoCard) {
        stockBajoCard.style.borderColor = 'var(--success)';
        stockBajoCard.style.boxShadow = '0 4px 15px rgba(76, 175, 80, 0.3)';
    }

    // Actualizar valor total del inventario en algún lugar visible
    const headerLeft = document.querySelector('.header-left p');
    if (headerLeft) {
        headerLeft.textContent = `Valor total del inventario: S/ ${statsData.valorTotal.toFixed(2)}`;
    }
}

// Cargar actividad reciente
async function cargarActividadReciente() {
    try {
        const response = await fetch('/api/dashboard/actividad-reciente');
        const data = await response.json();
        
        if (data.success) {
            actividadReciente = data.data;
            actualizarActividadReciente();
        } else {
            throw new Error(data.message);
        }
    } catch (error) {
        console.error('Error al cargar actividad reciente:', error);
        throw error;
    }
}

// Actualizar actividad reciente en el DOM
function actualizarActividadReciente() {
    const activityList = document.querySelector('.activity-list');
    if (!activityList) return;

    if (actividadReciente.length === 0) {
        activityList.innerHTML = `
            <div class="activity-item">
                <div class="activity-icon">📝</div>
                <div class="activity-details">
                    <div class="activity-title">No hay actividad reciente</div>
                    <div class="activity-time">Comienza realizando algunas ventas</div>
                </div>
            </div>
        `;
        return;
    }

    activityList.innerHTML = actividadReciente.map(actividad => {
        const fechaFormateada = formatearTiempoRelativo(new Date(actividad.fecha));
        
        return `
            <div class="activity-item">
                <div class="activity-icon">💰</div>
                <div class="activity-details">
                    <div class="activity-title">${actividad.titulo}</div>
                    <div class="activity-time">${fechaFormateada}</div>
                    ${actividad.descripcion ? `<div style="font-size: 0.8rem; color: var(--text-muted); margin-top: 2px;">${actividad.descripcion}</div>` : ''}
                </div>
                <div style="color: var(--success); font-weight: 600;">${actividad.valor}</div>
            </div>
        `;
    }).join('');
}

// Cargar productos con stock bajo
async function cargarStockBajo() {
    try {
        const response = await fetch('/api/dashboard/stock-bajo');
        const data = await response.json();
        
        if (data.success) {
            stockBajo = data.data;
        } else {
            throw new Error(data.message);
        }
    } catch (error) {
        console.error('Error al cargar stock bajo:', error);
        throw error;
    }
}

// Cargar productos más vendidos
async function cargarTopProductos() {
    try {
        const response = await fetch('/api/dashboard/top-productos');
        const data = await response.json();
        
        if (data.success) {
            actualizarTopProductos(data.data);
        } else {
            throw new Error(data.message);
        }
    } catch (error) {
        console.error('Error al cargar productos más vendidos:', error);
        throw error;
    }
}

// Actualizar productos más vendidos
function actualizarTopProductos(productos) {
    const chartPlaceholder = document.querySelector('.chart-card:nth-child(2) .chart-placeholder');
    if (!chartPlaceholder) return;

    if (productos.length === 0) {
        chartPlaceholder.innerHTML = '<span>No hay datos de ventas disponibles</span>';
        return;
    }

    // Crear una lista simple de productos más vendidos
    const productosHTML = productos.slice(0, 5).map((producto, index) => {
        return `
            <div style="display: flex; justify-content: space-between; align-items: center; padding: 10px; background: var(--color3); margin-bottom: 8px; border-radius: 6px;">
                <div>
                    <div style="font-weight: 600;">${index + 1}. ${producto.nombre}</div>
                    <div style="font-size: 0.8rem; color: var(--text-muted);">${producto.categoria}</div>
                </div>
                <div style="text-align: right;">
                    <div style="font-weight: 600; color: var(--accent);">${producto.total_vendido} unidades</div>
                    <div style="font-size: 0.8rem; color: var(--success);">S/ ${parseFloat(producto.total_ingresos).toFixed(2)}</div>
                </div>
            </div>
        `;
    }).join('');

    chartPlaceholder.innerHTML = `
        <div style="width: 100%; height: 100%; overflow-y: auto; padding: 10px;">
            ${productosHTML}
        </div>
    `;
}

// Mostrar notificaciones
function mostrarNotificaciones() {
    if (stockBajo.length === 0) {
        mostrarMensaje('No hay notificaciones pendientes', 'info');
        return;
    }

    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.style.display = 'block';
    modal.innerHTML = `
        <div class="modal-content" style="max-width: 600px; background: var(--color2); color: var(--text-light);">
            <div class="modal-header" style="background: var(--warning); color: var(--color1); padding: 20px; border-radius: 8px 8px 0 0;">
                <h3>🔔 Notificaciones - Stock Bajo</h3>
                <span class="close" onclick="cerrarModal()" style="color: var(--color1); cursor: pointer; float: right; font-size: 24px;">&times;</span>
            </div>
            <div class="modal-body" style="padding: 20px;">
                <p style="margin-bottom: 20px;">Los siguientes productos tienen stock bajo (menos de 20 unidades):</p>
                <div style="max-height: 300px; overflow-y: auto;">
                    ${stockBajo.map(producto => `
                        <div style="display: flex; justify-content: space-between; align-items: center; padding: 12px; background: var(--color3); margin-bottom: 8px; border-radius: 6px;">
                            <div>
                                <div style="font-weight: 600;">${producto.nombre}</div>
                                <div style="font-size: 0.8rem; color: var(--text-muted);">${producto.categoria}</div>
                            </div>
                            <div style="text-align: right;">
                                <div style="font-weight: 600; color: var(--warning);">${producto.stock} ${producto.unidad}</div>
                                <div style="font-size: 0.8rem; color: var(--text-muted);">S/ ${parseFloat(producto.precio).toFixed(2)}</div>
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>
            <div class="modal-footer" style="padding: 20px; text-align: right;">
                <button onclick="window.location.href='inventario.html'" style="background: var(--accent); color: white; border: none; padding: 10px 20px; border-radius: 6px; cursor: pointer; margin-right: 10px;">
                    Ir al Inventario
                </button>
                <button onclick="cerrarModal()" style="background: var(--color4); color: var(--text-light); border: none; padding: 10px 20px; border-radius: 6px; cursor: pointer;">
                    Cerrar
                </button>
            </div>
        </div>
    `;

    document.body.appendChild(modal);
}

// Mostrar productos con stock bajo
function mostrarStockBajo() {
    if (stockBajo.length === 0) {
        mostrarMensaje('¡Excelente! No hay productos con stock bajo', 'success');
        return;
    }
    
    mostrarNotificaciones();
}

// Cerrar modal
function cerrarModal() {
    const modals = document.querySelectorAll('.modal');
    modals.forEach(modal => modal.remove());
}

// Formatear tiempo relativo
function formatearTiempoRelativo(fecha) {
    const ahora = new Date();
    const diferencia = ahora - fecha;
    const minutos = Math.floor(diferencia / (1000 * 60));
    const horas = Math.floor(diferencia / (1000 * 60 * 60));
    const dias = Math.floor(diferencia / (1000 * 60 * 60 * 24));

    if (minutos < 1) return 'Hace un momento';
    if (minutos < 60) return `Hace ${minutos} minuto${minutos > 1 ? 's' : ''}`;
    if (horas < 24) return `Hace ${horas} hora${horas > 1 ? 's' : ''}`;
    if (dias < 7) return `Hace ${dias} día${dias > 1 ? 's' : ''}`;
    
    return fecha.toLocaleDateString('es-ES');
}

// Mostrar loading
function mostrarLoading(mostrar) {
    let overlay = document.getElementById('loadingOverlay');
    
    if (mostrar && !overlay) {
        overlay = document.createElement('div');
        overlay.id = 'loadingOverlay';
        overlay.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(6, 6, 6, 0.8);
            display: flex;
            justify-content: center;
            align-items: center;
            z-index: 9999;
            color: var(--text-light);
            font-size: 1.2rem;
        `;
        overlay.innerHTML = `
            <div style="text-align: center;">
                <div style="font-size: 2rem; margin-bottom: 10px;">⏳</div>
                <div>Cargando datos...</div>
            </div>
        `;
        document.body.appendChild(overlay);
    } else if (!mostrar && overlay) {
        overlay.remove();
    }
}

// Mostrar mensaje
function mostrarMensaje(mensaje, tipo = 'info') {
    const colores = {
        success: 'var(--success)',
        error: 'var(--danger)',
        warning: 'var(--warning)',
        info: 'var(--color4)'
    };

    const iconos = {
        success: '✅',
        error: '❌',
        warning: '⚠️',
        info: 'ℹ️'
    };

    const toast = document.createElement('div');
    toast.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: ${colores[tipo]};
        color: white;
        padding: 15px 20px;
        border-radius: 8px;
        box-shadow: 0 4px 15px rgba(0,0,0,0.3);
        z-index: 10000;
        max-width: 400px;
        animation: slideInRight 0.3s ease-out;
    `;
    toast.innerHTML = `${iconos[tipo]} ${mensaje}`;
    
    document.body.appendChild(toast);
    
    setTimeout(() => {
        toast.remove();
    }, tipo === 'error' ? 5000 : 3000);
}

// Mostrar error
function mostrarError(mensaje) {
    mostrarMensaje(mensaje, 'error');
}

// Agregar estilos CSS
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
    
    .modal {
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0,0,0,0.8);
        display: flex;
        justify-content: center;
        align-items: center;
        z-index: 10000;
    }
    
    .modal-content {
        border-radius: 8px;
        max-height: 80vh;
        overflow-y: auto;
    }
    
    .stat-card:hover {
        cursor: pointer;
    }
`;
document.head.appendChild(style);
