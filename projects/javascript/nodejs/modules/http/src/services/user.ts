import { UserModel } from '../models';
import { userStore } from '../stores';
import { BaseService } from './base';

const apiUrl = process.env.API_URL;

export class UserService extends BaseService<UserModel> {
  protected store = userStore;
  protected url = `${apiUrl}/users`;
}

export const userService = new UserService();
