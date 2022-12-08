import { MatchModel, QueueModel, QueueMemberModel } from '@tenlastic/http';

import dependencies from '../dependencies';

/**
 * If a Queue Member is already in a Match, remove them from the Queue.
 */
export async function deleteConflictedQueueMembers(
  queue: QueueModel,
  queueMembers: QueueMemberModel[],
) {
  const matches = await getMatchesWithUsers(queue.namespaceId, queueMembers);
  const conflictedQueueMembers = getConflictedQueueMembers(matches, queueMembers);

  const promises = conflictedQueueMembers.map((cqm) =>
    dependencies.queueMemberService.delete(cqm.namespaceId, cqm._id),
  );

  return Promise.all(promises);
}

/**
 * Returns all Queue Members currently in a Match.
 */
function getConflictedQueueMembers(matches: MatchModel[], queueMembers: QueueMemberModel[]) {
  const matchUserIds = matches.map((m) => m.userIds).flat();
  const queueMemberIds = queueMembers.map((qm) => qm.userIds).flat();

  const intersection = matchUserIds.filter((ui) => queueMemberIds.includes(ui));

  return queueMembers.filter((qm) => qm.userIds.some((uid) => intersection.includes(uid)));
}

/**
 * Find Matches that are associated with Queue Members.
 */
function getMatchesWithUsers(namespaceId: string, queueMembers: QueueMemberModel[]) {
  const queueMemberIds = queueMembers.map((qm) => qm.userIds).flat();
  const where = { finishedAt: { $exists: false }, 'teams.userIds': { $in: queueMemberIds } };

  return dependencies.matchService.find(namespaceId, { where });
}
