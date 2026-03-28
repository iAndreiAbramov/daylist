import { IBase } from './base';
import { CategoryTypeEnum } from '../../enums';

export type { CategoryTypeEnum };

export interface ICategory extends IBase {
  userId: string;
  name: string;
  type: CategoryTypeEnum;
  position: number;
}
