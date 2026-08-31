import { IsString, IsEnum, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateOrganizationDto {
  @ApiProperty({
    example: 'Acme Corp',
    description: 'The name of the organization',
  })
  @IsString()
  name: string;

  @ApiPropertyOptional({
    example: 'A software company',
    description: 'Description of the organization',
  })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({
    example: 'https://acme.com',
    description: 'Organization website',
  })
  @IsString()
  @IsOptional()
  website?: string;

  @ApiPropertyOptional({
    example: 'ACTIVE',
    enum: ['ACTIVE', 'INACTIVE'],
    description: 'Status of the organization',
  })
  @IsEnum(['ACTIVE', 'INACTIVE'])
  @IsOptional()
  status?: 'ACTIVE' | 'INACTIVE' = 'ACTIVE';
}
