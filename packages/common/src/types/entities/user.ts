import { IBase } from './base';

export interface IUser extends IBase {
  email: string;
  passwordHash: string | null;
  googleId: string | null;
}
