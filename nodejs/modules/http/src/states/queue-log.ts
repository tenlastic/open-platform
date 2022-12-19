import { EntityState, QueryEntity, StoreConfig } from '@datorama/akita';

import { QueueLogModel } from '../models/queue-log';
import { BaseStore } from './base';

export interface QueueLogState extends EntityState<QueueLogModel> {}

@StoreConfig({ idKey: 'unix', name: 'queue-logs', resettable: true })
export class QueueLogStore extends BaseStore<QueueLogState, QueueLogModel> {}

export class QueueLogQuery extends QueryEntity<QueueLogState, QueueLogModel> {
  constructor(protected store: QueueLogStore) {
    super(store);
  }
}
