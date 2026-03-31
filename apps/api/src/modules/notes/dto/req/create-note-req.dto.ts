import { IsOptional, IsString, IsUUID, MinLength } from 'class-validator';

export class CreateNoteReqDto {
  @IsUUID()
  categoryId!: string;

  @IsString()
  @MinLength(1)
  title!: string;

  @IsOptional()
  @IsString()
  content?: string;

  @IsOptional()
  @IsUUID()
  taskId?: string;

  @IsOptional()
  @IsUUID()
  financeEntryId?: string;
}
