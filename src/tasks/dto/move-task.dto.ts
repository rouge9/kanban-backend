import { IsInt, IsNotEmpty, IsString, Min } from 'class-validator';

export class MoveTaskDto {
  @IsString()
  @IsNotEmpty()
  columnId: string;

  @IsInt()
  @Min(0)
  newOrder: number;
}
