import { EntityState, EntityStore, QueryEntity, StoreConfig } from '@datorama/akita';

import { MessageModel } from '../models/message';

export interface MessageState extends EntityState<MessageModel> {}

@StoreConfig({ deepFreezeFn: (o) => o, idKey: '_id', name: 'messages', resettable: true })
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
    return this.selectAll({ filterBy: (m) => m.toGroupId === groupId, sortBy: 'createdAt' });
  }

  public selectAllUnreadFromUser(fromUserId: string, toUserId: string) {
    return this.selectAll({
      filterBy: (m) =>
        m.fromUserId === fromUserId &&
        !m.readReceipts.some((rr) => rr.userId === toUserId) &&
        !m.toGroupId,
      sortBy: 'createdAt',
    });
  }

  public selectAllUnreadFromUsers(fromUserIds: string[], toUserId: string) {
    return this.selectAll({
      filterBy: (m) =>
        fromUserIds.includes(m.fromUserId) &&
        !m.readReceipts.some((rr) => rr.userId === toUserId) &&
        !m.toGroupId,
      sortBy: 'createdAt',
    });
  }

  public selectAllUnreadInGroup(groupId: string, userId) {
    return this.selectAll({
      filterBy: (m) =>
        m.toGroupId === groupId && !m.readReceipts.some((rr) => rr.userId === userId),
      sortBy: 'createdAt',
    });
  }
}
