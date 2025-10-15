import { IsNotEmpty, IsString, MinLength, MaxLength } from 'class-validator';

export class ChatRequestDto {
  @IsNotEmpty({ message: 'La pregunta no puede estar vacía' })
  @IsString({ message: 'La pregunta debe ser una cadena de texto' })
  @MinLength(1, { message: 'La pregunta debe tener al menos 1 carácter' })
  @MaxLength(1000, { message: 'La pregunta no puede exceder 1000 caracteres' })
  prompt: string;
}

export class SugerenciasRequestDto {
  @IsNotEmpty({
    message: 'Debe proporcionar síntomas para obtener sugerencias',
  })
  @IsString({ message: 'Los síntomas deben ser una cadena de texto' })
  @MinLength(2, { message: 'Los síntomas deben tener al menos 2 caracteres' })
  @MaxLength(500, { message: 'Los síntomas no pueden exceder 500 caracteres' })
  sintomas: string;
}

export class BuscarClienteRequestDto {
  @IsNotEmpty({ message: 'Debe proporcionar un término de búsqueda' })
  @IsString({ message: 'El término de búsqueda debe ser una cadena de texto' })
  @MinLength(1, {
    message: 'El término de búsqueda debe tener al menos 1 carácter',
  })
  @MaxLength(100, {
    message: 'El término de búsqueda no puede exceder 100 caracteres',
  })
  busqueda: string;
}
