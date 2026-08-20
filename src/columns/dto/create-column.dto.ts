import { IsString, IsNotEmpty, IsInt, IsOptional, Min } from 'class-validator';

export class CreateColumnDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsNotEmpty()
  boardId: string;

  @IsInt()
  @Min(0)
  @IsOptional()
  order?: number;
}
