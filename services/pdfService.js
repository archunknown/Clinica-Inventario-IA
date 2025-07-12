const puppeteer = require('puppeteer');
const path = require('path');

class PDFService {
    // Generar boleta PDF
    static async generarBoletaPDF(ventaData) {
        let browser;
        try {
            browser = await puppeteer.launch({
                headless: 'new',
                args: [
                    '--no-sandbox', 
                    '--disable-setuid-sandbox',
                    '--disable-dev-shm-usage',
                    '--disable-accelerated-2d-canvas',
                    '--no-first-run',
                    '--no-zygote',
                    '--disable-gpu'
                ]
            });

            const page = await browser.newPage();
            
            // Generar HTML de la boleta
            const htmlContent = this.generarHTMLBoleta(ventaData);
            
            await page.setContent(htmlContent, { 
                waitUntil: 'networkidle0' 
            });

            // Configurar el PDF
            const pdfBuffer = await page.pdf({
                format: 'A4',
                printBackground: true,
                preferCSSPageSize: true,
                displayHeaderFooter: false,
                margin: {
                    top: '20px',
                    right: '20px',
                    bottom: '20px',
                    left: '20px'
                },
                timeout: 30000
            });

            return pdfBuffer;

        } catch (error) {
            console.error('Error al generar PDF:', error);
            throw error;
        } finally {
            if (browser) {
                await browser.close();
            }
        }
    }

    // Generar HTML para la boleta
    static generarHTMLBoleta(ventaData) {
        const fechaActual = new Date().toLocaleDateString('es-ES', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });

        const itemsHTML = ventaData.items.map(item => `
            <tr>
                <td style="padding: 12px; border-bottom: 1px solid #e0e0e0;">${item.nombre}</td>
                <td style="padding: 12px; border-bottom: 1px solid #e0e0e0; text-align: center;">${item.cantidad}</td>
                <td style="padding: 12px; border-bottom: 1px solid #e0e0e0; text-align: right;">$${item.precio_unitario.toFixed(2)}</td>
                <td style="padding: 12px; border-bottom: 1px solid #e0e0e0; text-align: right; font-weight: bold;">$${item.subtotal.toFixed(2)}</td>
            </tr>
        `).join('');

        return `
        <!DOCTYPE html>
        <html lang="es">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Boleta de Venta - ${ventaData.venta_id}</title>
            <style>
                * {
                    margin: 0;
                    padding: 0;
                    box-sizing: border-box;
                }
                
                body {
                    font-family: 'Arial', sans-serif;
                    line-height: 1.6;
                    color: #333;
                    background: white;
                }
                
                .boleta-container {
                    max-width: 800px;
                    margin: 0 auto;
                    padding: 40px;
                    background: white;
                }
                
                .header {
                    text-align: center;
                    margin-bottom: 40px;
                    border-bottom: 3px solid #184b71;
                    padding-bottom: 20px;
                }
                
                .logo {
                    font-size: 2.5rem;
                    font-weight: bold;
                    color: #184b71;
                    margin-bottom: 10px;
                }
                
                .empresa-info {
                    color: #666;
                    font-size: 1.1rem;
                }
                
                .boleta-info {
                    display: grid;
                    grid-template-columns: 1fr 1fr;
                    gap: 40px;
                    margin-bottom: 40px;
                }
                
                .info-section h3 {
                    color: #184b71;
                    margin-bottom: 15px;
                    font-size: 1.2rem;
                    border-bottom: 2px solid #e91e63;
                    padding-bottom: 5px;
                }
                
                .info-item {
                    display: flex;
                    justify-content: space-between;
                    margin-bottom: 8px;
                    padding: 5px 0;
                }
                
                .info-label {
                    font-weight: 600;
                    color: #555;
                }
                
                .info-value {
                    color: #333;
                }
                
                .productos-table {
                    width: 100%;
                    border-collapse: collapse;
                    margin-bottom: 30px;
                    box-shadow: 0 2px 10px rgba(0,0,0,0.1);
                }
                
                .productos-table thead {
                    background: #184b71;
                    color: white;
                }
                
                .productos-table th {
                    padding: 15px 12px;
                    text-align: left;
                    font-weight: 600;
                }
                
                .productos-table th:nth-child(2),
                .productos-table th:nth-child(3),
                .productos-table th:nth-child(4) {
                    text-align: center;
                }
                
                .productos-table th:nth-child(3),
                .productos-table th:nth-child(4) {
                    text-align: right;
                }
                
                .productos-table tbody tr:nth-child(even) {
                    background: #f8f9fa;
                }
                
                .productos-table tbody tr:hover {
                    background: #e3f2fd;
                }
                
                .totales {
                    margin-top: 30px;
                    padding: 20px;
                    background: #f8f9fa;
                    border-radius: 8px;
                    border-left: 5px solid #e91e63;
                }
                
                .total-item {
                    display: flex;
                    justify-content: space-between;
                    margin-bottom: 10px;
                    padding: 5px 0;
                }
                
                .total-final {
                    border-top: 2px solid #184b71;
                    padding-top: 15px;
                    margin-top: 15px;
                    font-size: 1.3rem;
                    font-weight: bold;
                    color: #184b71;
                }
                
                .footer {
                    margin-top: 50px;
                    text-align: center;
                    color: #666;
                    font-size: 0.9rem;
                    border-top: 1px solid #e0e0e0;
                    padding-top: 20px;
                }
                
                .agradecimiento {
                    background: #e3f2fd;
                    padding: 20px;
                    border-radius: 8px;
                    text-align: center;
                    margin: 30px 0;
                    border-left: 5px solid #2196f3;
                }
                
                .agradecimiento h4 {
                    color: #1976d2;
                    margin-bottom: 10px;
                }
                
                @media print {
                    body {
                        -webkit-print-color-adjust: exact;
                    }
                }
            </style>
        </head>
        <body>
            <div class="boleta-container">
                <!-- Header -->
                <div class="header">
                    <div class="logo">🏥 CLÍNICA INVENTARIO</div>
                    <div class="empresa-info">
                        Sistema de Gestión Médica<br>
                        RUC: 20123456789 | Tel: (01) 234-5678<br>
                        Dirección: Av. Salud 123, Lima - Perú
                    </div>
                </div>
                
                <!-- Información de la boleta -->
                <div class="boleta-info">
                    <div class="info-section">
                        <h3>📋 Datos de la Venta</h3>
                        <div class="info-item">
                            <span class="info-label">N° Boleta:</span>
                            <span class="info-value">#${String(ventaData.venta_id).padStart(6, '0')}</span>
                        </div>
                        <div class="info-item">
                            <span class="info-label">Fecha:</span>
                            <span class="info-value">${fechaActual}</span>
                        </div>
                        <div class="info-item">
                            <span class="info-label">Estado:</span>
                            <span class="info-value" style="color: #4caf50; font-weight: bold;">COMPLETADA</span>
                        </div>
                    </div>
                    
                    <div class="info-section">
                        <h3>👤 Datos del Cliente</h3>
                        <div class="info-item">
                            <span class="info-label">Atendido por:</span>
                            <span class="info-value">${ventaData.usuario_nombre || 'Usuario'}</span>
                        </div>
                        <div class="info-item">
                            <span class="info-label">Tipo:</span>
                            <span class="info-value">Venta Directa</span>
                        </div>
                        <div class="info-item">
                            <span class="info-label">Método de Pago:</span>
                            <span class="info-value">Efectivo</span>
                        </div>
                    </div>
                </div>
                
                <!-- Tabla de productos -->
                <table class="productos-table">
                    <thead>
                        <tr>
                            <th>Producto</th>
                            <th>Cantidad</th>
                            <th>Precio Unit.</th>
                            <th>Subtotal</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${itemsHTML}
                    </tbody>
                </table>
                
                <!-- Totales -->
                <div class="totales">
                    <div class="total-item">
                        <span>Subtotal:</span>
                        <span>$${ventaData.total.toFixed(2)}</span>
                    </div>
                    <div class="total-item">
                        <span>IGV (18%):</span>
                        <span>$${(ventaData.total * 0.18).toFixed(2)}</span>
                    </div>
                    <div class="total-item">
                        <span>Descuento:</span>
                        <span>$0.00</span>
                    </div>
                    <div class="total-item total-final">
                        <span>TOTAL A PAGAR:</span>
                        <span>$${(ventaData.total * 1.18).toFixed(2)}</span>
                    </div>
                </div>
                
                <!-- Agradecimiento -->
                <div class="agradecimiento">
                    <h4>¡Gracias por su compra!</h4>
                    <p>Su salud es nuestra prioridad. Esperamos haberle brindado un excelente servicio.</p>
                </div>
                
                <!-- Footer -->
                <div class="footer">
                    <p>Esta boleta fue generada electrónicamente el ${fechaActual}</p>
                    <p>Para consultas o reclamos, comuníquese al (01) 234-5678 o visite www.clinica-inventario.com</p>
                    <p><strong>¡Conserve este comprobante para futuras referencias!</strong></p>
                </div>
            </div>
        </body>
        </html>
        `;
    }
}

module.exports = PDFService;
