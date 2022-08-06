import { BaseModel } from './base';

export class UserModel extends BaseModel {
  public email?: string;
  public password?: string;
  public username?: string;

  constructor(parameters?: Partial<UserModel>) {
    super(parameters);
  }
}
