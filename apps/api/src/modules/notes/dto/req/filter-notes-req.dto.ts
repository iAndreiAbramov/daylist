import { IsOptional, IsUUID } from 'class-validator';

export class FilterNotesReqDto {
  @IsOptional()
  @IsUUID()
  categoryId?: string;

  @IsOptional()
  @IsUUID()
  taskId?: string;

  @IsOptional()
  @IsUUID()
  financeEntryId?: string;
}
