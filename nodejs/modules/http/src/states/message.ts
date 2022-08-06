import { EntityState, EntityStore, QueryEntity, StoreConfig } from '@datorama/akita';

import { MessageModel } from '../models/message';

export interface MessageState extends EntityState<MessageModel> {}

@StoreConfig({ idKey: '_id', name: 'messages', resettable: true })
export class MessageStore extends EntityStore<MessageState, MessageModel> {}

export class MessageQuery extends QueryEntity<MessageState, MessageModel> {
  constructor(protected store: MessageStore) {
    super(store);
  }

  public selectAllInConversation(fromUserId: string, toUserId: string) {
    return this.selectAll({
      filterBy: (m) =>
        [m.fromUserId, m.toUserId].sort().toString() === [fromUserId, toUserId].sort().toString(),
      sortBy: 'createdAt',
    });
  }

  public selectAllInGroup(groupId: string) {
    return this.selectAll({
      filterBy: (m) => m.toGroupId === groupId,
      sortBy: 'createdAt',
    });
  }

  public selectAllUnreadInConversation(fromUserId: string, toUserId: string) {
    return this.selectAll({
      filterBy: (m) =>
        !m.readByUserIds.includes(fromUserId) &&
        [m.fromUserId, m.toUserId].sort().toString() === [fromUserId, toUserId].sort().toString(),
      sortBy: 'createdAt',
    });
  }

  public selectAllUnreadInGroup(groupId: string, userId) {
    return this.selectAll({
      filterBy: (m) => m.toGroupId === groupId && !m.readByUserIds.includes(userId),
      sortBy: 'createdAt',
    });
  }
}
