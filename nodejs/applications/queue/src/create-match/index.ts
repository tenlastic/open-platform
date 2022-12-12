import { MatchModel, QueueModel } from '@tenlastic/http';

import dependencies from '../dependencies';

import { deleteConflictedQueueMembers } from '../delete-conflicted-queue-members';
import { getTeams } from '../get-teams';

/**
 * Creates a Match if enough Queue Members exist.
 */
export async function createMatch(queue: QueueModel): Promise<MatchModel> {
  const queueMembers = dependencies.queueMemberQuery.getAll();
  const teams = getTeams(queue, queueMembers);

  // Throw an error if not enough teams were found.
  if (!teams) {
    const count = queueMembers.reduce((a, b) => a + b.userIds.length, 0);
    throw new Error(`Not enough Queue Members. Users: ${count}.`);
  }

  // Get Queue Members from teams.
  const userIds = teams.map((t) => t.userIds).flat();
  const matchedQueueMembers = queueMembers.filter((qm) =>
    qm.userIds.find((ui) => userIds.includes(ui)),
  );

  // If any Queue Members have been deleted, retry creating the Match.
  const deletedQueueMembers = await deleteConflictedQueueMembers(queue, matchedQueueMembers);
  if (deletedQueueMembers.length) {
    return createMatch(queue);
  }

  // Create the Match.
  let match: MatchModel;
  if (queue.confirmationSeconds) {
    match = await dependencies.matchService.create(queue.namespaceId, {
      confirmationExpiresAt: new Date(Date.now() + queue.confirmationSeconds * 1000),
      queueId: queue._id,
      teams,
    });
  } else {
    match = await dependencies.matchService.create(queue.namespaceId, {
      queueId: queue._id,
      teams,
    });
  }

  // Remove matched Queue Members from the store.
  for (const mqm of matchedQueueMembers) {
    dependencies.queueMemberStore.remove(mqm._id);
  }

  // Return the Match.
  return match;
}
