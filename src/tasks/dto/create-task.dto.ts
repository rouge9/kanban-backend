import { IsString, IsNotEmpty, IsOptional, IsInt, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateTaskDto {
  @ApiProperty({
    example: 'Implement login',
    description: 'The title of the task',
  })
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiProperty({
    example: 'uuid',
    description: 'The column ID this task belongs to',
  })
  @IsString()
  @IsNotEmpty()
  columnId: string;

  @ApiPropertyOptional({
    example: 'Add JWT authentication...',
    description: 'Detailed description of the task',
  })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({
    example: 0,
    description: 'Display order within the column',
  })
  @IsInt()
  @Min(0)
  @IsOptional()
  order?: number;

  @ApiPropertyOptional({
    example: 'uuid',
    description: 'ID of the user assigned to this task',
  })
  @IsString()
  @IsOptional()
  assigneeId?: string;
}
