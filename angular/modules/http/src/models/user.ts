import { Model } from './model';

export class User extends Model {
  public email?: string;
  public password?: string;
  public username?: string;

  constructor(params?: Partial<User>) {
    super(params);
  }
}
