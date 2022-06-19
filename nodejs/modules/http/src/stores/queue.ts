import { EntityState, EntityStore, QueryEntity, StoreConfig } from '@datorama/akita';

import { QueueModel } from '../models/queue';
import { queueService } from '../services/queue';

export interface QueueState extends EntityState<QueueModel> {}

@StoreConfig({ idKey: '_id', name: 'queues', resettable: true })
export class QueueStore extends EntityStore<QueueState, QueueModel> {
  constructor() {
    super();

    queueService.emitter.on('create', record => this.add(record));
    queueService.emitter.on('delete', _id => this.remove(_id));
    queueService.emitter.on('set', records => this.upsertMany(records));
    queueService.emitter.on('update', record => this.upsert(record._id, record));
  }
}

export class QueueQuery extends QueryEntity<QueueState, QueueModel> {
  constructor(protected store: QueueStore) {
    super(store);
  }
}

export const queueStore = new QueueStore();
export const queueQuery = new QueueQuery(queueStore);
