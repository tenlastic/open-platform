import { Ref } from '@hasezoey/typegoose';
import { GameServer, QueueDocument, QueueMember, UserDocument } from '@tenlastic/mongoose-models';

/**
 * If a User is already in a match, remove them from other Queues.
 */
export async function removeConflictedUsers(
  queue: QueueDocument,
  userIds: Array<Ref<UserDocument>>,
) {
  // Find GameServers that are associated with a Queue and QueueMembers.
  const gameServers = await GameServer.find({
    allowedUserIds: { $in: userIds },
    namespaceId: queue.namespaceId,
    queueId: { $exists: true },
  });

  // Find which Users are already in a match.
  const allowedUserIdStrings = gameServers
    .map(gs => gs.allowedUserIds)
    .reduce((a, b) => a.concat(b), [])
    .map(aui => aui.toString());
  const userIdStrings = userIds.map(ui => ui.toString());
  const intersection = allowedUserIdStrings.filter(aui => userIdStrings.includes(aui));

  // Remove already matched Users from queues.
  const otherQueueMembers = await QueueMember.find({ userId: { $in: intersection } });
  return Promise.all(otherQueueMembers.map(qm => qm.remove()));
}