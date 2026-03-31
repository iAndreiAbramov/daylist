import { Expose } from 'class-transformer';
import { CategoryTypeEnum } from '@daylist/common';
import type { ICategory } from '@daylist/common/types/entities';

export class CategoryResDto implements ICategory {
  @Expose()
  id!: string;

  @Expose()
  userId!: string;

  @Expose()
  name!: string;

  @Expose()
  type!: CategoryTypeEnum;

  @Expose()
  position!: number;

  @Expose()
  createdAt!: Date;

  @Expose()
  updatedAt!: Date;
}
