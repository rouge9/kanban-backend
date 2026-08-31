import { IsString, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateBoardDto {
  @ApiProperty({ example: 'Main Board', description: 'The name of the board' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({
    example: 'uuid',
    description: 'The project ID this board belongs to',
  })
  @IsString()
  @IsNotEmpty()
  projectId: string;
}
