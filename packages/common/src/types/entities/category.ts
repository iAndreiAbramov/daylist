import { IBase } from './base';

export type CategoryType = 'task' | 'note' | 'finance';

export interface ICategory extends IBase {
  userId: string;
  name: string;
  type: CategoryType;
  position: number;
}
