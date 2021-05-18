import { apiUrl } from '../api-url';
import { UserModel } from '../models';
import { userStore } from '../stores';
import { BaseService } from './base';

export class UserService extends BaseService<UserModel> {
  protected store = userStore;
  protected get url() {
    return `${apiUrl}/users`;
  }
}

export const userService = new UserService();
