import { Transform } from 'class-transformer';
import { IsOptional, IsUUID, ValidateIf } from 'class-validator';

export class FilterTasksReqDto {
  @IsOptional()
  @IsUUID()
  categoryId?: string;

  @IsOptional()
  @Transform(({ value }: { value: string }) =>
    value === 'null' ? null : value,
  )
  @ValidateIf((_, value) => value !== null)
  @IsUUID()
  parentId?: string | null;
}
