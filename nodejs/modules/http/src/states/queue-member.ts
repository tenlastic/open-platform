import { EntityState, EntityStore, QueryEntity, StoreConfig } from '@datorama/akita';

import { QueueMemberModel } from '../models/queue-member';

export interface QueueMemberState extends EntityState<QueueMemberModel> {}

@StoreConfig({ idKey: '_id', name: 'queue-members', resettable: true })
export class QueueMemberStore extends EntityStore<QueueMemberState, QueueMemberModel> {}

export class QueueMemberQuery extends QueryEntity<QueueMemberState, QueueMemberModel> {
  constructor(protected store: QueueMemberStore) {
    super(store);
  }
}
