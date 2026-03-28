import { IBase } from './base';

export interface INote extends IBase {
  userId: string;
  categoryId: string;
  title: string;
  content: string;
  taskId: string | null;
  financeEntryId: string | null;
}
