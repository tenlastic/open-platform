import { AuthorizationRequestModel } from '../models';
import { AuthorizationRequestService } from '../services';
import { BaseState } from './base';

export class AuthorizationRequestState extends BaseState<
  AuthorizationRequestModel,
  AuthorizationRequestService
> {
  constructor(service: AuthorizationRequestService) {
    super('_id', service);
  }
}
