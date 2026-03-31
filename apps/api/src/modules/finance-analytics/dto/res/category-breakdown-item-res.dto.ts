import { Expose } from 'class-transformer';

export class CategoryBreakdownItemResDto {
  @Expose()
  categoryId!: string;

  @Expose()
  income!: number;

  @Expose()
  expense!: number;

  @Expose()
  balance!: number;
}
