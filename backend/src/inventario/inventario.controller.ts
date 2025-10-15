import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  ParseIntPipe,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { InventarioService } from './inventario.service';
import { CreateMedicamentoDto } from './dto/create-medicamento.dto';
import { UpdateMedicamentoDto } from './dto/update-medicamento.dto';
import { UpdateStockDto } from './dto/update-stock.dto';

@ApiTags('inventario')
@Controller('inventario')
export class InventarioController {
  constructor(private readonly inventarioService: InventarioService) {}

  @Post()
  @ApiOperation({ summary: 'Crear nuevo medicamento' })
  @ApiResponse({ status: 201, description: 'Medicamento creado correctamente' })
  @ApiResponse({ status: 400, description: 'Datos inválidos' })
  @ApiResponse({
    status: 409,
    description: 'Ya existe un medicamento con ese nombre',
  })
  async create(@Body() createMedicamentoDto: CreateMedicamentoDto) {
    const medicamento =
      await this.inventarioService.create(createMedicamentoDto);
    return {
      success: true,
      message: 'Medicamento creado correctamente',
      data: medicamento,
    };
  }

  @Get()
  @ApiOperation({ summary: 'Obtener todos los medicamentos activos' })
  @ApiResponse({
    status: 200,
    description: 'Lista de medicamentos obtenida correctamente',
  })
  async findAll() {
    const medicamentos = await this.inventarioService.findAll();
    return {
      success: true,
      data: medicamentos,
    };
  }

  @Get('search')
  @ApiOperation({
    summary: 'Buscar medicamentos por nombre, categoría o descripción',
  })
  @ApiQuery({ name: 'q', description: 'Término de búsqueda', required: true })
  @ApiResponse({ status: 200, description: 'Búsqueda realizada correctamente' })
  @ApiResponse({ status: 400, description: 'Término de búsqueda requerido' })
  async search(@Query('q') query: string) {
    const medicamentos = await this.inventarioService.search(query);
    return {
      success: true,
      data: medicamentos,
    };
  }

  @Get('low-stock')
  @ApiOperation({ summary: 'Obtener medicamentos con stock bajo' })
  @ApiQuery({
    name: 'limit',
    description: 'Límite de stock (default: 20)',
    required: false,
  })
  @ApiResponse({
    status: 200,
    description: 'Medicamentos con stock bajo obtenidos correctamente',
  })
  async getLowStock(@Query('limit') limit?: number) {
    const medicamentos = await this.inventarioService.getLowStock(
      limit ? parseInt(limit.toString()) : 20,
    );
    return {
      success: true,
      data: medicamentos,
    };
  }

  @Get('stats')
  @ApiOperation({ summary: 'Obtener estadísticas del inventario' })
  @ApiResponse({
    status: 200,
    description: 'Estadísticas obtenidas correctamente',
  })
  async getStats() {
    const stats = await this.inventarioService.getStats();
    return {
      success: true,
      data: stats,
    };
  }

  @Get('categories')
  @ApiOperation({ summary: 'Obtener todas las categorías disponibles' })
  @ApiResponse({
    status: 200,
    description: 'Categorías obtenidas correctamente',
  })
  async getCategories() {
    const categories = await this.inventarioService.getCategories();
    return {
      success: true,
      data: categories,
    };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener medicamento por ID' })
  @ApiParam({ name: 'id', description: 'ID del medicamento', type: Number })
  @ApiResponse({ status: 200, description: 'Medicamento encontrado' })
  @ApiResponse({ status: 404, description: 'Medicamento no encontrado' })
  async findOne(@Param('id', ParseIntPipe) id: number) {
    const medicamento = await this.inventarioService.findOne(id);
    return {
      success: true,
      data: medicamento,
    };
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Actualizar medicamento' })
  @ApiParam({ name: 'id', description: 'ID del medicamento', type: Number })
  @ApiResponse({
    status: 200,
    description: 'Medicamento actualizado correctamente',
  })
  @ApiResponse({ status: 404, description: 'Medicamento no encontrado' })
  @ApiResponse({
    status: 409,
    description: 'Ya existe otro medicamento con ese nombre',
  })
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateMedicamentoDto: UpdateMedicamentoDto,
  ) {
    const medicamento = await this.inventarioService.update(
      id,
      updateMedicamentoDto,
    );
    return {
      success: true,
      message: 'Medicamento actualizado correctamente',
      data: medicamento,
    };
  }

  @Patch(':id/stock')
  @ApiOperation({ summary: 'Actualizar stock de medicamento' })
  @ApiParam({ name: 'id', description: 'ID del medicamento', type: Number })
  @ApiResponse({ status: 200, description: 'Stock actualizado correctamente' })
  @ApiResponse({ status: 404, description: 'Medicamento no encontrado' })
  @ApiResponse({ status: 400, description: 'Operación no válida' })
  async updateStock(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateStockDto: UpdateStockDto,
  ) {
    const medicamento = await this.inventarioService.updateStock(
      id,
      updateStockDto,
    );
    return {
      success: true,
      message: 'Stock actualizado correctamente',
      data: medicamento,
    };
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Eliminar medicamento' })
  @ApiParam({ name: 'id', description: 'ID del medicamento', type: Number })
  @ApiResponse({
    status: 200,
    description: 'Medicamento eliminado correctamente',
  })
  @ApiResponse({ status: 404, description: 'Medicamento no encontrado' })
  async remove(@Param('id', ParseIntPipe) id: number) {
    await this.inventarioService.remove(id);
    return {
      success: true,
      message: 'Medicamento eliminado correctamente',
    };
  }
}
