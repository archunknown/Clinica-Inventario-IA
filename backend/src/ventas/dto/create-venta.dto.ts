import {
  IsNotEmpty,
  IsArray,
  IsNumber,
  IsOptional,
  ValidateNested,
  IsString,
  Min,
  MaxLength,
} from 'class-validator';
import { Type } from 'class-transformer';

class VentaItemDto {
  @IsNotEmpty({ message: 'El ID del medicamento es obligatorio' })
  @IsNumber({}, { message: 'El ID del medicamento debe ser un número' })
  medicamento_id: number;

  @IsNotEmpty({ message: 'La cantidad es obligatoria' })
  @IsNumber({}, { message: 'La cantidad debe ser un número' })
  @Min(1, { message: 'La cantidad debe ser al menos 1' })
  cantidad: number;
}

class ClienteDto {
  @IsNotEmpty({ message: 'El DNI es obligatorio' })
  @IsString({ message: 'El DNI debe ser una cadena de texto' })
  @MaxLength(15, { message: 'El DNI no puede exceder 15 caracteres' })
  dni: string;

  @IsOptional()
  @IsString({ message: 'El nombre debe ser una cadena de texto' })
  @MaxLength(50, { message: 'El nombre no puede exceder 50 caracteres' })
  nombre?: string;

  @IsOptional()
  @IsString({ message: 'El apellido paterno debe ser una cadena de texto' })
  @MaxLength(50, {
    message: 'El apellido paterno no puede exceder 50 caracteres',
  })
  apellido_paterno?: string;

  @IsOptional()
  @IsString({ message: 'El apellido materno debe ser una cadena de texto' })
  @MaxLength(50, {
    message: 'El apellido materno no puede exceder 50 caracteres',
  })
  apellido_materno?: string;
}

export class CreateVentaDto {
  @IsNotEmpty({ message: 'Los items son obligatorios' })
  @IsArray({ message: 'Los items deben ser un arreglo' })
  @ValidateNested({ each: true })
  @Type(() => VentaItemDto)
  items: VentaItemDto[];

  @IsNotEmpty({ message: 'El ID del usuario es obligatorio' })
  @IsNumber({}, { message: 'El ID del usuario debe ser un número' })
  usuario_id: number;

  @IsOptional()
  @ValidateNested()
  @Type(() => ClienteDto)
  cliente?: ClienteDto;
}
