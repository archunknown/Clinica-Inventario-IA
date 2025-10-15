import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateVentaDto } from './dto/create-venta.dto';
import {
  VentaSummary,
  VentaWithDetails,
  VentaStats,
  StockVerificationResult,
  CreateVentaResult,
} from './interfaces/venta.interfaces';

@Injectable()
export class VentasService {
  constructor(private prisma: PrismaService) {}

  // Crear una nueva venta
  async create(createVentaDto: CreateVentaDto): Promise<CreateVentaResult> {
    const { items, usuario_id, cliente } = createVentaDto;

    // Verificar que el usuario existe
    const usuario = await this.prisma.usuario.findUnique({
      where: { id: usuario_id },
    });

    if (!usuario) {
      throw new NotFoundException('Usuario no encontrado');
    }

    // Manejar cliente si se proporciona
    let clienteId: number | null = null;
    if (cliente && cliente.dni) {
      let clienteExistente = await this.prisma.cliente.findUnique({
        where: { dni: cliente.dni },
      });

      if (!clienteExistente) {
        // Crear nuevo cliente
        clienteExistente = await this.prisma.cliente.create({
          data: {
            dni: cliente.dni,
            nombre: cliente.nombre || null,
            apellidoPaterno: cliente.apellido_paterno || null,
            apellidoMaterno: cliente.apellido_materno || null,
          },
        });
      }
      clienteId = clienteExistente.id;
    }

    // Verificar stock disponible y calcular total
    let total = 0;
    const itemsConPrecios: {
      medicamento_id: number;
      cantidad: number;
      precio_unitario: number;
      subtotal: number;
    }[] = [];

    for (const item of items) {
      const medicamento = await this.prisma.medicamento.findUnique({
        where: { id: item.medicamento_id },
      });

      if (!medicamento) {
        throw new NotFoundException(
          `Medicamento con ID ${item.medicamento_id} no encontrado`,
        );
      }

      if (!medicamento.activo) {
        throw new BadRequestException(
          `El medicamento ${medicamento.nombre} no está disponible`,
        );
      }

      if (medicamento.stock < item.cantidad) {
        throw new BadRequestException(
          `Stock insuficiente para ${medicamento.nombre}. Disponible: ${medicamento.stock}, solicitado: ${item.cantidad}`,
        );
      }

      const subtotal = Number(medicamento.precio) * item.cantidad;
      total += subtotal;

      itemsConPrecios.push({
        medicamento_id: item.medicamento_id,
        cantidad: item.cantidad,
        precio_unitario: Number(medicamento.precio),
        subtotal: subtotal,
      });
    }

    // Crear la venta en una transacción
    return await this.prisma.$transaction(async (prisma) => {
      // Crear la venta
      const venta = await prisma.venta.create({
        data: {
          usuarioId: usuario_id,
          clienteId: clienteId,
          total: total,
        },
      });

      // Crear los detalles de la venta y actualizar stock
      for (const item of itemsConPrecios) {
        await prisma.detalleVenta.create({
          data: {
            ventaId: venta.id,
            medicamentoId: item.medicamento_id,
            cantidad: item.cantidad,
            precioUnitario: item.precio_unitario,
            subtotal: item.subtotal,
          },
        });

        // Actualizar stock del medicamento
        await prisma.medicamento.update({
          where: { id: item.medicamento_id },
          data: {
            stock: {
              decrement: item.cantidad,
            },
          },
        });
      }

      return {
        venta_id: venta.id,
        total: total,
        fecha: venta.fecha,
        items: itemsConPrecios.length,
        cliente:
          clienteId && cliente
            ? {
                dni: cliente.dni,
                nombre: cliente.nombre,
                apellido_paterno: cliente.apellido_paterno,
                apellido_materno: cliente.apellido_materno,
              }
            : null,
      };
    });
  }

  // Obtener todas las ventas
  async findAll(
    limit: number = 50,
    offset: number = 0,
  ): Promise<VentaSummary[]> {
    const ventas = await this.prisma.venta.findMany({
      take: limit,
      skip: offset,
      orderBy: { fecha: 'desc' },
      include: {
        usuario: {
          select: { username: true },
        },
        cliente: {
          select: {
            dni: true,
            nombre: true,
            apellidoPaterno: true,
            apellidoMaterno: true,
          },
        },
        detalleVenta: {
          select: { id: true },
        },
      },
    });

    return ventas.map((venta) => ({
      id: venta.id,
      fecha: venta.fecha,
      total: Number(venta.total),
      usuarioId: venta.usuarioId,
      clienteId: venta.clienteId,
      usuario_nombre: venta.usuario?.username || null,
      cliente_dni: venta.cliente?.dni || null,
      cliente_nombre: venta.cliente
        ? `${venta.cliente.nombre || ''} ${venta.cliente.apellidoPaterno || ''} ${venta.cliente.apellidoMaterno || ''}`.trim()
        : null,
      total_items: venta.detalleVenta.length,
    }));
  }

  // Obtener venta por ID con detalles
  async findOne(id: number): Promise<VentaWithDetails> {
    const venta = await this.prisma.venta.findUnique({
      where: { id },
      include: {
        usuario: {
          select: { username: true },
        },
        cliente: {
          select: {
            dni: true,
            nombre: true,
            apellidoPaterno: true,
            apellidoMaterno: true,
          },
        },
        detalleVenta: {
          include: {
            medicamento: {
              select: {
                nombre: true,
                categoria: true,
                precio: true,
              },
            },
          },
        },
      },
    });

    if (!venta) {
      throw new NotFoundException('Venta no encontrada');
    }

    return {
      id: venta.id,
      fecha: venta.fecha,
      total: Number(venta.total),
      usuarioId: venta.usuarioId,
      clienteId: venta.clienteId,
      usuario: venta.usuario,
      cliente: venta.cliente,
      detalleVenta: venta.detalleVenta,
      usuario_nombre: venta.usuario?.username || null,
      cliente_dni: venta.cliente?.dni || null,
      cliente_nombre: venta.cliente?.nombre || null,
      cliente_apellido_paterno: venta.cliente?.apellidoPaterno || null,
      cliente_apellido_materno: venta.cliente?.apellidoMaterno || null,
      cliente_nombre_completo: venta.cliente
        ? `${venta.cliente.nombre || ''} ${venta.cliente.apellidoPaterno || ''} ${venta.cliente.apellidoMaterno || ''}`.trim()
        : null,
      detalles: venta.detalleVenta.map((detalle) => ({
        id: detalle.id,
        cantidad: detalle.cantidad,
        precioUnitario: Number(detalle.precioUnitario),
        subtotal: Number(detalle.subtotal),
        medicamento_nombre: detalle.medicamento.nombre,
        categoria: detalle.medicamento.categoria || '',
        precio_unitario: Number(detalle.precioUnitario),
      })),
    };
  }

  // Obtener estadísticas de ventas
  async getStats(fechaInicio?: string, fechaFin?: string): Promise<VentaStats> {
    const whereClause =
      fechaInicio && fechaFin
        ? {
            fecha: {
              gte: new Date(fechaInicio),
              lte: new Date(fechaFin),
            },
          }
        : {};

    const [totalStats, todayStats] = await Promise.all([
      this.prisma.venta.aggregate({
        where: whereClause,
        _count: { id: true },
        _sum: { total: true },
        _avg: { total: true },
      }),
      this.prisma.venta.aggregate({
        where: {
          ...whereClause,
          fecha: {
            gte: new Date(new Date().toDateString()),
            lt: new Date(new Date().getTime() + 24 * 60 * 60 * 1000),
          },
        },
        _count: { id: true },
        _sum: { total: true },
      }),
    ]);

    return {
      total_ventas: totalStats._count.id,
      total_ingresos: Number(totalStats._sum.total || 0),
      promedio_venta: Number(totalStats._avg.total || 0),
      ventas_hoy: todayStats._count.id,
      ingresos_hoy: Number(todayStats._sum.total || 0),
    };
  }

  // Obtener ventas por fecha
  async findByDate(fecha: string) {
    const startDate = new Date(fecha);
    const endDate = new Date(startDate.getTime() + 24 * 60 * 60 * 1000);

    const ventas = await this.prisma.venta.findMany({
      where: {
        fecha: {
          gte: startDate,
          lt: endDate,
        },
      },
      include: {
        usuario: {
          select: { username: true },
        },
        detalleVenta: {
          select: { id: true },
        },
      },
      orderBy: { fecha: 'desc' },
    });

    return ventas.map((venta) => ({
      ...venta,
      usuario_nombre: venta.usuario?.username,
      total_items: venta.detalleVenta.length,
    }));
  }

  // Verificar stock para carrito
  async verificarStock(
    items: { medicamento_id: number; cantidad: number }[],
  ): Promise<StockVerificationResult> {
    const errores: {
      medicamento_id: number;
      error: string;
      nombre?: string;
      stock_disponible?: number;
      cantidad_solicitada?: number;
    }[] = [];

    for (const item of items) {
      const medicamento = await this.prisma.medicamento.findUnique({
        where: { id: item.medicamento_id },
        select: { id: true, nombre: true, stock: true, activo: true },
      });

      if (!medicamento) {
        errores.push({
          medicamento_id: item.medicamento_id,
          error: 'Medicamento no encontrado',
        });
      } else if (!medicamento.activo) {
        errores.push({
          medicamento_id: item.medicamento_id,
          nombre: medicamento.nombre,
          error: 'Medicamento no disponible',
        });
      } else if (medicamento.stock < item.cantidad) {
        errores.push({
          medicamento_id: item.medicamento_id,
          nombre: medicamento.nombre,
          stock_disponible: medicamento.stock,
          cantidad_solicitada: item.cantidad,
          error: 'Stock insuficiente',
        });
      }
    }

    return {
      disponible: errores.length === 0,
      errores,
    };
  }
}
