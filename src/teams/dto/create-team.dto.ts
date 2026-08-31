import { IsString, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateTeamDto {
  @ApiProperty({ example: 'Engineering', description: 'The name of the team' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ example: 'uuid', description: 'The organization ID' })
  @IsString()
  @IsNotEmpty()
  organizationId: string;
}
