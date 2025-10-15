import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  ParseIntPipe,
  BadRequestException,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { VentasService } from './ventas.service';
import { CreateVentaDto } from './dto/create-venta.dto';
import { BoletaData } from './interfaces/venta.interfaces';

@ApiTags('ventas')
@Controller('ventas')
export class VentasController {
  constructor(private readonly ventasService: VentasService) {}

  @Post()
  @ApiOperation({ summary: 'Crear nueva venta' })
  @ApiResponse({ status: 201, description: 'Venta creada correctamente' })
  @ApiResponse({
    status: 400,
    description: 'Datos inválidos o stock insuficiente',
  })
  @ApiResponse({
    status: 404,
    description: 'Usuario o medicamento no encontrado',
  })
  async create(@Body() createVentaDto: CreateVentaDto) {
    const result = await this.ventasService.create(createVentaDto);
    return {
      success: true,
      message: 'Venta creada exitosamente',
      data: result,
    };
  }

  @Get()
  @ApiOperation({ summary: 'Obtener todas las ventas' })
  @ApiQuery({
    name: 'limit',
    description: 'Límite de resultados (default: 50)',
    required: false,
  })
  @ApiQuery({
    name: 'offset',
    description: 'Offset para paginación (default: 0)',
    required: false,
  })
  @ApiResponse({
    status: 200,
    description: 'Lista de ventas obtenida correctamente',
  })
  async findAll(
    @Query('limit') limit?: number,
    @Query('offset') offset?: number,
  ) {
    const ventas = await this.ventasService.findAll(
      limit ? parseInt(limit.toString()) : 50,
      offset ? parseInt(offset.toString()) : 0,
    );
    return {
      success: true,
      data: ventas,
    };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener venta por ID con detalles' })
  @ApiParam({ name: 'id', description: 'ID de la venta', type: Number })
  @ApiResponse({ status: 200, description: 'Venta encontrada' })
  @ApiResponse({ status: 404, description: 'Venta no encontrada' })
  async findOne(@Param('id', ParseIntPipe) id: number) {
    const venta = await this.ventasService.findOne(id);
    return {
      success: true,
      data: venta,
    };
  }

  @Get('stats/general')
  @ApiOperation({ summary: 'Obtener estadísticas generales de ventas' })
  @ApiQuery({
    name: 'fecha_inicio',
    description: 'Fecha de inicio (YYYY-MM-DD)',
    required: false,
  })
  @ApiQuery({
    name: 'fecha_fin',
    description: 'Fecha de fin (YYYY-MM-DD)',
    required: false,
  })
  @ApiResponse({
    status: 200,
    description: 'Estadísticas obtenidas correctamente',
  })
  async getStats(
    @Query('fecha_inicio') fechaInicio?: string,
    @Query('fecha_fin') fechaFin?: string,
  ) {
    const stats = await this.ventasService.getStats(fechaInicio, fechaFin);
    return {
      success: true,
      data: stats,
    };
  }

  @Get('fecha/:fecha')
  @ApiOperation({ summary: 'Obtener ventas por fecha específica' })
  @ApiParam({ name: 'fecha', description: 'Fecha en formato YYYY-MM-DD' })
  @ApiResponse({ status: 200, description: 'Ventas obtenidas correctamente' })
  async findByDate(@Param('fecha') fecha: string) {
    const ventas = await this.ventasService.findByDate(fecha);
    return {
      success: true,
      data: ventas,
    };
  }

  @Post('verificar-stock')
  @ApiOperation({ summary: 'Verificar disponibilidad de stock para carrito' })
  @ApiResponse({ status: 200, description: 'Verificación completada' })
  @ApiResponse({ status: 400, description: 'Formato de items inválido' })
  async verificarStock(
    @Body() body: { items: { medicamento_id: number; cantidad: number }[] },
  ) {
    if (!body.items || !Array.isArray(body.items)) {
      throw new BadRequestException('Debe proporcionar una lista de items');
    }

    const result = await this.ventasService.verificarStock(body.items);
    return {
      success: true,
      data: result,
    };
  }

  @Get(':id/boleta')
  @ApiOperation({
    summary: 'Generar boleta HTML para venta (para impresión PDF)',
  })
  @ApiParam({ name: 'id', description: 'ID de la venta', type: Number })
  @ApiResponse({ status: 200, description: 'Boleta generada correctamente' })
  @ApiResponse({ status: 404, description: 'Venta no encontrada' })
  async generarBoleta(@Param('id', ParseIntPipe) id: number) {
    const venta = await this.ventasService.findOne(id);

    // Preparar datos para la boleta
    const ventaData: BoletaData = {
      venta_id: venta.id,
      total: Number(venta.total),
      fecha: venta.fecha,
      usuario_nombre: venta.usuario_nombre || 'Usuario',
      items: venta.detalles.map((detalle) => ({
        nombre: detalle.medicamento_nombre,
        cantidad: detalle.cantidad,
        precio_unitario: Number(detalle.precioUnitario),
        subtotal: Number(detalle.subtotal),
      })),
      cliente: venta.clienteId
        ? {
            dni: venta.cliente_dni || '',
            nombre: venta.cliente_nombre || '',
            apellido_paterno: venta.cliente_apellido_paterno || '',
            apellido_materno: venta.cliente_apellido_materno || '',
            nombre_completo: venta.cliente_nombre_completo || '',
          }
        : null,
    };

    // Generar HTML para boleta (versión simplificada sin Puppeteer)
    const htmlContent = this.generarBoletaHTML(ventaData);

    return htmlContent;
  }

  private generarBoletaHTML(ventaData: BoletaData): string {
    const clienteInfo = ventaData.cliente
      ? `<div style="margin-bottom: 20px;">
        <h3>Datos del Cliente</h3>
        <p><strong>DNI:</strong> ${ventaData.cliente.dni}</p>
        <p><strong>Nombre:</strong> ${ventaData.cliente.nombre_completo}</p>
      </div>`
      : '';

    const itemsHTML = ventaData.items
      .map(
        (item) => `
      <tr>
        <td style="padding: 8px; border-bottom: 1px solid #ddd;">${item.nombre}</td>
        <td style="padding: 8px; border-bottom: 1px solid #ddd; text-align: center;">${item.cantidad}</td>
        <td style="padding: 8px; border-bottom: 1px solid #ddd; text-align: right;">S/ ${item.precio_unitario.toFixed(2)}</td>
        <td style="padding: 8px; border-bottom: 1px solid #ddd; text-align: right;">S/ ${item.subtotal.toFixed(2)}</td>
      </tr>
    `,
      )
      .join('');

    return `
      <!DOCTYPE html>
      <html lang="es">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Boleta de Venta - ${ventaData.venta_id}</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 20px; }
          .header { text-align: center; margin-bottom: 30px; }
          .boleta-info { margin-bottom: 20px; }
          table { width: 100%; border-collapse: collapse; margin-top: 20px; }
          th { background-color: #f5f5f5; padding: 10px; text-align: left; border-bottom: 2px solid #ddd; }
          .total { font-weight: bold; font-size: 18px; margin-top: 20px; text-align: right; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>Clínica Inventario IA</h1>
          <h2>Boleta de Venta</h2>
        </div>

        <div class="boleta-info">
          <p><strong>N° Venta:</strong> ${ventaData.venta_id}</p>
          <p><strong>Fecha:</strong> ${new Date(ventaData.fecha).toLocaleString('es-PE')}</p>
          <p><strong>Usuario:</strong> ${ventaData.usuario_nombre}</p>
        </div>

        ${clienteInfo}

        <table>
          <thead>
            <tr>
              <th>Producto</th>
              <th style="text-align: center;">Cantidad</th>
              <th style="text-align: right;">Precio Unit.</th>
              <th style="text-align: right;">Subtotal</th>
            </tr>
          </thead>
          <tbody>
            ${itemsHTML}
          </tbody>
        </table>

        <div class="total">
          <p>TOTAL: S/ ${ventaData.total.toFixed(2)}</p>
        </div>

        <div style="margin-top: 40px; text-align: center; font-size: 12px; color: #666;">
          <p>Gracias por su compra</p>
          <p>Clínica Inventario IA - Sistema de Gestión Farmacéutica</p>
        </div>
      </body>
      </html>
    `;
  }
}
