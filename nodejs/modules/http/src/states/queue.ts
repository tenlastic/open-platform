import { EntityState, QueryEntity, StoreConfig } from '@datorama/akita';

import { QueueModel } from '../models/queue';
import { BaseStore } from './base';

export interface QueueState extends EntityState<QueueModel> {}

@StoreConfig({ idKey: '_id', name: 'queues', resettable: true })
export class QueueStore extends BaseStore<QueueState, QueueModel> {}

export class QueueQuery extends QueryEntity<QueueState, QueueModel> {
  constructor(protected store: QueueStore) {
    super(store);
  }
}
