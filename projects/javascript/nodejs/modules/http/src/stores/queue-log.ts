import { EntityState, EntityStore, QueryEntity, StoreConfig } from '@datorama/akita';

import { QueueLogModel } from '../models/queue-log';
import { queueLogService } from '../services/queue-log';

export interface QueueLogState extends EntityState<QueueLogModel> {}

@StoreConfig({ idKey: 'unix', name: 'queue-logs', resettable: true })
export class QueueLogStore extends EntityStore<QueueLogState, QueueLogModel> {
  constructor() {
    super();

    queueLogService.emitter.on('create', record => this.add(record));
    queueLogService.emitter.on('delete', _id => this.remove(_id));
    queueLogService.emitter.on('set', records => this.upsertMany(records));
    queueLogService.emitter.on('update', record => this.upsert(record._id, record));
  }
}

export class QueueLogQuery extends QueryEntity<QueueLogState, QueueLogModel> {
  constructor(protected store: QueueLogStore) {
    super(store);
  }
}

export const queueLogStore = new QueueLogStore();
export const queueLogQuery = new QueueLogQuery(queueLogStore);
