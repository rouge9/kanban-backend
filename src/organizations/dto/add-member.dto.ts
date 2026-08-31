import { IsEmail, IsEnum, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class AddMemberDto {
  @ApiProperty({
    example: 'user@example.com',
    description: 'The email address of the user to invite',
  })
  @IsEmail()
  email: string;

  @ApiPropertyOptional({
    example: 'USER',
    enum: ['ADMIN', 'USER'],
    description: 'The role of the member in the organization',
  })
  @IsEnum(['ADMIN', 'USER'])
  @IsOptional()
  role?: 'ADMIN' | 'USER' = 'USER';
}
