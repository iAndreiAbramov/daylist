import { Expose } from 'class-transformer';
import type { ITask } from '@daylist/common/types/entities';

export class TaskResDto implements ITask {
  @Expose()
  id!: string;

  @Expose()
  userId!: string;

  @Expose()
  categoryId!: string;

  @Expose()
  parentId!: string | null;

  @Expose()
  title!: string;

  @Expose()
  completed!: boolean;

  @Expose()
  position!: number;

  @Expose()
  createdAt!: Date;

  @Expose()
  updatedAt!: Date;
}
