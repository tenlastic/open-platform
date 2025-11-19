import { UserModel } from '../models';
import { UserService } from '../services';
import { BaseState } from './base';

export class UserState extends BaseState<UserModel, UserService> {
  constructor(service: UserService) {
    super('_id', service);
  }
}
