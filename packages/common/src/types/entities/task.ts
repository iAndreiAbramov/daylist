import { IBase } from './base';

export interface ITask extends IBase {
  userId: string;
  categoryId: string;
  parentId: string | null;
  title: string;
  completed: boolean;
  position: number;
}
