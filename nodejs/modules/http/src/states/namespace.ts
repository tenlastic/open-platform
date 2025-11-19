import { NamespaceModel } from '../models';
import { NamespaceService } from '../services';
import { BaseState } from './base';

export class NamespaceState extends BaseState<NamespaceModel, NamespaceService> {
  constructor(service: NamespaceService) {
    super('_id', service);
  }
}
