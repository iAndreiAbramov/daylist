import { IsInt, IsUUID, Min } from 'class-validator';

export class PositionItemReqDto {
  @IsUUID()
  id!: string;

  @IsInt()
  @Min(0)
  position!: number;
}
