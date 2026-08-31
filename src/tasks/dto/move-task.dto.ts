import { IsInt, IsNotEmpty, IsString, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class MoveTaskDto {
  @ApiProperty({
    example: 'uuid',
    description: 'The ID of the column to move the task to',
  })
  @IsString()
  @IsNotEmpty()
  columnId: string;

  @ApiProperty({
    example: 1,
    description: 'The new order position of the task within the column',
  })
  @IsInt()
  @Min(0)
  newOrder: number;
}
