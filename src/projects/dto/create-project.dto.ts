import { IsString, IsNotEmpty, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateProjectDto {
  @ApiProperty({
    example: 'Website Redesign',
    description: 'The name of the project',
  })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiPropertyOptional({
    example: 'Revamping the main landing page',
    description: 'A short description of the project',
  })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({
    example: 'uuid',
    description: 'The organization ID this project belongs to',
  })
  @IsString()
  @IsNotEmpty()
  organizationId: string;

  @ApiPropertyOptional({
    example: 'uuid',
    description: 'The optional team ID assigned to this project',
  })
  @IsString()
  @IsOptional()
  teamId?: string;
}
