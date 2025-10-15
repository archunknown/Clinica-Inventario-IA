import { IsNotEmpty, IsString, IsNumber, IsIn, Min } from 'class-validator';

export class UpdateStockDto {
  @IsNotEmpty({ message: 'El stock es obligatorio' })
  @IsNumber({}, { message: 'El stock debe ser un número' })
  @Min(0, { message: 'El stock no puede ser negativo' })
  stock: number;

  @IsNotEmpty({ message: 'La operación es obligatoria' })
  @IsString({ message: 'La operación debe ser una cadena de texto' })
  @IsIn(['add', 'subtract', 'set'], {
    message: 'La operación debe ser: add, subtract o set',
  })
  operacion: 'add' | 'subtract' | 'set';
}
