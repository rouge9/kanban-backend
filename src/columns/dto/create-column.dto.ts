import { IsString, IsNotEmpty, IsInt, IsOptional, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateColumnDto {
  @ApiProperty({ example: 'To Do', description: 'The name of the column' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ example: 'uuid', description: 'The board this column belongs to' })
  @IsString()
  @IsNotEmpty()
  boardId: string;

  @ApiPropertyOptional({ example: 0, description: 'The display order of the column' })
  @IsInt()
  @Min(0)
  @IsOptional()
  order?: number;

  @ApiPropertyOptional({ example: 'bg-blue-500', description: 'The color of the column' })
  @IsString()
  @IsOptional()
  color?: string;
}
