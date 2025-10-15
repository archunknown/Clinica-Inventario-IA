import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateMedicamentoDto } from './dto/create-medicamento.dto';
import { UpdateMedicamentoDto } from './dto/update-medicamento.dto';
import { UpdateStockDto } from './dto/update-stock.dto';

@Injectable()
export class InventarioService {
  constructor(private prisma: PrismaService) {}

  // Obtener todos los medicamentos activos
  async findAll() {
    return this.prisma.medicamento.findMany({
      where: { activo: true },
      orderBy: { nombre: 'asc' },
    });
  }

  // Obtener medicamento por ID
  async findOne(id: number) {
    const medicamento = await this.prisma.medicamento.findUnique({
      where: { id },
    });

    if (!medicamento) {
      throw new NotFoundException('Medicamento no encontrado');
    }

    return medicamento;
  }

  // Crear nuevo medicamento
  async create(createMedicamentoDto: CreateMedicamentoDto) {
    // Verificar si ya existe un medicamento con el mismo nombre
    const existingMedicamento = await this.prisma.medicamento.findFirst({
      where: {
        nombre: { equals: createMedicamentoDto.nombre, mode: 'insensitive' },
        activo: true,
      },
    });

    if (existingMedicamento) {
      throw new ConflictException('Ya existe un medicamento con ese nombre');
    }

    return this.prisma.medicamento.create({
      data: {
        nombre: createMedicamentoDto.nombre.trim(),
        categoria: createMedicamentoDto.categoria,
        stock: createMedicamentoDto.stock,
        precio: createMedicamentoDto.precio,
        descripcion: createMedicamentoDto.descripcion?.trim() || null,
        unidad: createMedicamentoDto.unidad || 'unidades',
      },
    });
  }

  // Actualizar medicamento
  async update(id: number, updateMedicamentoDto: UpdateMedicamentoDto) {
    // Verificar que el medicamento existe
    await this.findOne(id);

    // Si se está actualizando el nombre, verificar que no exista otro con el mismo nombre
    if (updateMedicamentoDto.nombre) {
      const existingMedicamento = await this.prisma.medicamento.findFirst({
        where: {
          nombre: { equals: updateMedicamentoDto.nombre, mode: 'insensitive' },
          activo: true,
          id: { not: id },
        },
      });

      if (existingMedicamento) {
        throw new ConflictException(
          'Ya existe otro medicamento con ese nombre',
        );
      }
    }

    return this.prisma.medicamento.update({
      where: { id },
      data: {
        ...(updateMedicamentoDto.nombre && {
          nombre: updateMedicamentoDto.nombre.trim(),
        }),
        ...(updateMedicamentoDto.categoria && {
          categoria: updateMedicamentoDto.categoria,
        }),
        ...(updateMedicamentoDto.stock !== undefined && {
          stock: updateMedicamentoDto.stock,
        }),
        ...(updateMedicamentoDto.precio !== undefined && {
          precio: updateMedicamentoDto.precio,
        }),
        ...(updateMedicamentoDto.descripcion !== undefined && {
          descripcion: updateMedicamentoDto.descripcion?.trim() || null,
        }),
        ...(updateMedicamentoDto.unidad && {
          unidad: updateMedicamentoDto.unidad,
        }),
      },
    });
  }

  // Eliminar medicamento (eliminación física con CASCADE)
  async remove(id: number) {
    // Verificar que el medicamento existe
    await this.findOne(id);

    // La eliminación física se maneja con CASCADE en la base de datos
    return this.prisma.medicamento.delete({
      where: { id },
    });
  }

  // Buscar medicamentos
  async search(query: string) {
    if (!query || query.trim().length === 0) {
      throw new BadRequestException('El término de búsqueda es requerido');
    }

    return this.prisma.medicamento.findMany({
      where: {
        activo: true,
        OR: [
          { nombre: { contains: query, mode: 'insensitive' } },
          { categoria: { contains: query, mode: 'insensitive' } },
          { descripcion: { contains: query, mode: 'insensitive' } },
        ],
      },
      orderBy: { nombre: 'asc' },
    });
  }

  // Obtener medicamentos con stock bajo
  async getLowStock(limit: number = 20) {
    return this.prisma.medicamento.findMany({
      where: {
        activo: true,
        stock: { lt: limit },
      },
      orderBy: [{ stock: 'asc' }, { nombre: 'asc' }],
    });
  }

  // Actualizar stock de medicamento
  async updateStock(id: number, updateStockDto: UpdateStockDto) {
    // Verificar que el medicamento existe
    const medicamento = await this.findOne(id);

    let nuevoStock: number;
    switch (updateStockDto.operacion) {
      case 'add':
        nuevoStock = medicamento.stock + updateStockDto.stock;
        break;
      case 'subtract':
        nuevoStock = Math.max(0, medicamento.stock - updateStockDto.stock);
        break;
      case 'set':
        nuevoStock = updateStockDto.stock;
        break;
      default:
        throw new BadRequestException('Operación no válida');
    }

    return this.prisma.medicamento.update({
      where: { id },
      data: { stock: nuevoStock },
    });
  }

  // Obtener estadísticas del inventario
  async getStats() {
    const stats = await this.prisma.medicamento.aggregate({
      where: { activo: true },
      _count: { id: true },
      _sum: {
        stock: true,
      },
    });

    const valorTotal = await this.prisma.medicamento.aggregate({
      where: { activo: true },
      _sum: {
        precio: true,
      },
    });

    const stockBajo = await this.prisma.medicamento.count({
      where: {
        activo: true,
        stock: { lt: 20 },
      },
    });

    const precioPromedio = await this.prisma.medicamento.aggregate({
      where: { activo: true },
      _avg: {
        precio: true,
      },
    });

    return {
      totalProductos: stats._count.id,
      totalUnidades: stats._sum.stock || 0,
      valorTotal: valorTotal._sum.precio || 0,
      productosStockBajo: stockBajo,
      precioPromedio: precioPromedio._avg.precio || 0,
    };
  }

  // Obtener categorías únicas
  async getCategories() {
    const categories = await this.prisma.medicamento.findMany({
      where: { activo: true },
      select: { categoria: true },
      distinct: ['categoria'],
      orderBy: { categoria: 'asc' },
    });

    return categories.map((c) => c.categoria).filter(Boolean);
  }
}
