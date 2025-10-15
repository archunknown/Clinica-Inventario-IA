import {
  IsNotEmpty,
  IsString,
  IsNumber,
  IsOptional,
  Min,
  MaxLength,
} from 'class-validator';

export class CreateMedicamentoDto {
  @IsNotEmpty({ message: 'El nombre es obligatorio' })
  @IsString({ message: 'El nombre debe ser una cadena de texto' })
  @MaxLength(255, { message: 'El nombre no puede exceder 255 caracteres' })
  nombre: string;

  @IsNotEmpty({ message: 'La categoría es obligatoria' })
  @IsString({ message: 'La categoría debe ser una cadena de texto' })
  @MaxLength(100, { message: 'La categoría no puede exceder 100 caracteres' })
  categoria: string;

  @IsNotEmpty({ message: 'El stock es obligatorio' })
  @IsNumber({}, { message: 'El stock debe ser un número' })
  @Min(0, { message: 'El stock no puede ser negativo' })
  stock: number;

  @IsNotEmpty({ message: 'El precio es obligatorio' })
  @IsNumber({}, { message: 'El precio debe ser un número' })
  @Min(0.01, { message: 'El precio debe ser mayor a 0' })
  precio: number;

  @IsOptional()
  @IsString({ message: 'La descripción debe ser una cadena de texto' })
  @MaxLength(500, { message: 'La descripción no puede exceder 500 caracteres' })
  descripcion?: string;

  @IsOptional()
  @IsString({ message: 'La unidad debe ser una cadena de texto' })
  @MaxLength(50, { message: 'La unidad no puede exceder 50 caracteres' })
  unidad?: string;
}
