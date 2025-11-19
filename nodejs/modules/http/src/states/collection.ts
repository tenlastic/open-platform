import { CollectionModel } from '../models';
import { CollectionService } from '../services';
import { BaseState } from './base';

export class CollectionState extends BaseState<CollectionModel, CollectionService> {
  constructor(service: CollectionService) {
    super('_id', service);
  }
}
