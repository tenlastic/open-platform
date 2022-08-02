import {
  gameServerService,
  QueueModel,
  QueueMemberModel,
  queueMemberService,
} from '@tenlastic/http';

/**
 * If a User is already in a match, remove them from other Queues.
 * @return The remaining Queue Members.
 */
export async function removeConflictedUsers(queue: QueueModel, queueMembers: QueueMemberModel[]) {
  // Find GameServers that are associated with a Queue and QueueMembers.
  const userIds = queueMembers.map((qm) => qm.userIds).flat();
  const where = {
    authorizedUserIds: { $in: userIds },
    namespaceId: queue.namespaceId,
    queueId: { $exists: true },
  };
  const gameServers = await gameServerService.find(queue.namespaceId, { where });

  // Find which Users are already in a match.
  const authorizedUserIds = gameServers.map((gs) => gs.authorizedUserIds).flat();
  const intersection = authorizedUserIds.filter((aui) => userIds.includes(aui));
  const queueMemberIds = queueMembers
    .filter((qm) => qm.userIds.some((uid) => intersection.includes(uid)))
    .map((qm) => qm._id);

  // Remove conflicted Users from queues.
  const promises = queueMemberIds.map((qmi) => queueMemberService.delete(queue.namespaceId, qmi));
  return Promise.all(promises);
}
