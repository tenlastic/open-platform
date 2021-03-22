import * as requestPromiseNative from 'request-promise-native';

const accessToken = process.env.ACCESS_TOKEN;

export interface Queue {
  namespaceId: string;
}
export interface QueueMember {
  _id: string;
  userIds: string[];
}

/**
 * If a User is already in a match, remove them from other Queues.
 * @return The remaining Queue Members.
 */
export async function removeConflictedUsers(queue: Queue, queueMembers: QueueMember[]) {
  // Find GameServers that are associated with a Queue and QueueMembers.
  const userIds = queueMembers.map(qm => qm.userIds).flat();
  const query = {
    authorizedUserIds: { $in: userIds },
    namespaceId: queue.namespaceId,
    queueId: { $exists: true },
  };
  const gameServers = await requestPromiseNative.get({
    headers: { Authorization: `Bearer ${accessToken}` },
    json: true,
    qs: { query: JSON.stringify(query) },
    url: `http://api.default:3000/game-servers`,
  });

  // Find which Users are already in a match.
  const authorizedUserIds = gameServers.records.map(gs => gs.authorizedUserIds).flat();
  const intersection = authorizedUserIds.filter(aui => userIds.includes(aui));
  const queueMemberIds = queueMembers
    .filter(qm => qm.userIds.some(uid => intersection.includes(uid)))
    .map(qm => qm._id);

  // Remove already matched Users from queues.
  const promises = queueMemberIds.map(id =>
    requestPromiseNative.delete({
      headers: { Authorization: `Bearer ${accessToken}` },
      url: `http://api.default:3000/queue-members/${id}`,
    }),
  );
  await Promise.all(promises);

  return queueMembers.filter(qm => !queueMemberIds.includes(qm._id));
}
