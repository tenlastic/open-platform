import { EntityState, EntityStore, QueryEntity, StoreConfig } from '@datorama/akita';

import { QueueModel } from '../models/queue';

export interface QueueState extends EntityState<QueueModel> {}

@StoreConfig({ deepFreezeFn: (o) => o, idKey: '_id', name: 'queues', resettable: true })
export class QueueStore extends EntityStore<QueueState, QueueModel> {}

export class QueueQuery extends QueryEntity<QueueState, QueueModel> {
  constructor(protected store: QueueStore) {
    super(store);
  }
}
