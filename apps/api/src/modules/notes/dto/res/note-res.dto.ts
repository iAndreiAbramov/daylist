import { Expose } from 'class-transformer';
import type { INote } from '@daylist/common/types/entities';

export class NoteResDto implements INote {
  @Expose()
  id!: string;

  @Expose()
  userId!: string;

  @Expose()
  categoryId!: string;

  @Expose()
  title!: string;

  @Expose()
  content!: string;

  @Expose()
  taskId!: string | null;

  @Expose()
  financeEntryId!: string | null;

  @Expose()
  createdAt!: Date;

  @Expose()
  updatedAt!: Date;
}
