import { StorefrontModel } from '../models';
import { StorefrontService } from '../services';
import { BaseState } from './base';

export class StorefrontState extends BaseState<StorefrontModel, StorefrontService> {
  constructor(service: StorefrontService) {
    super('namespaceId', service);
  }
}
