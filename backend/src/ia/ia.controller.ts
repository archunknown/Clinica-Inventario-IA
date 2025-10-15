import { Controller, Post, Body, Get, Param } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { IAService } from './ia.service';
import {
  ChatRequestDto,
  SugerenciasRequestDto,
  BuscarClienteRequestDto,
} from './dto/chat-request.dto';

@ApiTags('ia')
@Controller('ia')
export class IAController {
  constructor(private readonly iaService: IAService) {}

  @Post('chat')
  @ApiOperation({ summary: 'Procesar consulta de chat con IA' })
  @ApiResponse({ status: 200, description: 'Consulta procesada correctamente' })
  @ApiResponse({ status: 400, description: 'Pregunta inválida' })
  @ApiResponse({ status: 500, description: 'Error interno del servidor' })
  async chat(@Body() chatRequestDto: ChatRequestDto) {
    const result = await this.iaService.chat(chatRequestDto.prompt);
    return result;
  }

  @Post('sugerencias')
  @ApiOperation({ summary: 'Obtener sugerencias de medicamentos por síntomas' })
  @ApiResponse({
    status: 200,
    description: 'Sugerencias obtenidas correctamente',
  })
  @ApiResponse({ status: 400, description: 'Síntomas inválidos' })
  async sugerencias(@Body() sugerenciasRequestDto: SugerenciasRequestDto) {
    const result = await this.iaService.obtenerSugerencias(
      sugerenciasRequestDto.sintomas,
    );
    return result;
  }

  @Get('verificar/:medicamento')
  @ApiOperation({ summary: 'Verificar disponibilidad de medicamento' })
  @ApiResponse({ status: 200, description: 'Verificación completada' })
  async verificarDisponibilidad(@Param('medicamento') medicamento: string) {
    const result = await this.iaService.verificarDisponibilidad(medicamento);
    return result;
  }

  @Post('buscar-cliente')
  @ApiOperation({ summary: 'Buscar cliente por DNI o nombre' })
  @ApiResponse({ status: 200, description: 'Búsqueda completada' })
  @ApiResponse({ status: 400, description: 'Término de búsqueda inválido' })
  async buscarCliente(
    @Body() buscarClienteRequestDto: BuscarClienteRequestDto,
  ) {
    const result = await this.iaService.buscarCliente(
      buscarClienteRequestDto.busqueda,
    );
    return result;
  }

  @Get('estadisticas-ventas')
  @ApiOperation({ summary: 'Obtener estadísticas de ventas' })
  @ApiResponse({
    status: 200,
    description: 'Estadísticas obtenidas correctamente',
  })
  async obtenerEstadisticasVentas() {
    const result = await this.iaService.obtenerEstadisticasVentas();
    return result;
  }

  @Get('analizar-inventario')
  @ApiOperation({ summary: 'Analizar inventario' })
  @ApiResponse({ status: 200, description: 'Análisis completado' })
  async analizarInventario() {
    const result = await this.iaService.analizarInventario();
    return result;
  }

  @Get('stats')
  @ApiOperation({ summary: 'Obtener estadísticas de uso de IA' })
  @ApiResponse({
    status: 200,
    description: 'Estadísticas obtenidas correctamente',
  })
  async getStats() {
    const result = await this.iaService.getStats();
    return result;
  }
}
