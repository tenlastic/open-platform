import { EntityState, QueryEntity, StoreConfig } from '@datorama/akita';

import { QueueMemberModel } from '../models/queue-member';
import { BaseStore } from './base';

export interface QueueMemberState extends EntityState<QueueMemberModel> {}

@StoreConfig({ idKey: '_id', deepFreezeFn: (o) => o, name: 'queue-members', resettable: true })
export class QueueMemberStore extends BaseStore<QueueMemberState, QueueMemberModel> {}

export class QueueMemberQuery extends QueryEntity<QueueMemberState, QueueMemberModel> {
  constructor(protected store: QueueMemberStore) {
    super(store);
  }
}
