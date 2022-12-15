import { EntityState, EntityStore, QueryEntity, StoreConfig } from '@datorama/akita';

import { QueueLogModel } from '../models/queue-log';

export interface QueueLogState extends EntityState<QueueLogModel> {}

@StoreConfig({ deepFreezeFn: (o) => o, idKey: 'unix', name: 'queue-logs', resettable: true })
export class QueueLogStore extends EntityStore<QueueLogState, QueueLogModel> {}

export class QueueLogQuery extends QueryEntity<QueueLogState, QueueLogModel> {
  constructor(protected store: QueueLogStore) {
    super(store);
  }
}
