import { EntityState, EntityStore, QueryEntity, StoreConfig } from '@datorama/akita';

import { QueueMemberModel } from '../models/queue-member';
import { queueMemberService } from '../services/queue-member';

export interface QueueMemberState extends EntityState<QueueMemberModel> {}

@StoreConfig({ idKey: '_id', name: 'queue-members', resettable: true })
export class QueueMemberStore extends EntityStore<QueueMemberState, QueueMemberModel> {
  constructor() {
    super();

    queueMemberService.emitter.on('create', record => this.add(record));
    queueMemberService.emitter.on('delete', _id => this.remove(_id));
    queueMemberService.emitter.on('set', records => this.upsertMany(records));
    queueMemberService.emitter.on('update', record => this.upsert(record._id, record));
  }
}

export class QueueMemberQuery extends QueryEntity<QueueMemberState, QueueMemberModel> {
  constructor(protected store: QueueMemberStore) {
    super(store);
  }
}

export const queueMemberStore = new QueueMemberStore();
export const queueMemberQuery = new QueueMemberQuery(queueMemberStore);
