import { MatchModel, QueueModel } from '@tenlastic/http';

import dependencies from '../dependencies';

import { deleteConflictedQueueMembers } from '../delete-conflicted-queue-members';
import { getTeams } from '../get-teams';

/**
 * Creates a Match if enough Queue Members exist.
 */
export async function createMatch(queue: QueueModel): Promise<MatchModel> {
  const queueMembers = dependencies.queueMemberQuery.getAll({
    filterBy: (qm) => !qm.matchedAt,
    sortBy: 'createdAt',
  });
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

  // Create the Match.
  let match: MatchModel;
  try {
    if (queue.confirmation) {
      match = await dependencies.matchService.create(queue.namespaceId, {
        gameServerTemplateId: queue.gameServerTemplateId,
        invitationsExpireAt: new Date(Date.now() + queue.invitationSeconds * 1000),
        queueId: queue._id,
        teams,
      });
    } else {
      match = await dependencies.matchService.create(queue.namespaceId, {
        gameServerTemplateId: queue.gameServerTemplateId,
        queueId: queue._id,
        teams,
      });
    }
  } catch (e) {
    // If any Queue Members are already in a match, delete them and try again if successful.
    const deletedQueueMembers = await deleteConflictedQueueMembers(queue, matchedQueueMembers);
    if (deletedQueueMembers.length) {
      return createMatch(queue);
    }

    throw e;
  }

  // Set MatchedAt on Queue Members.
  for (const matchedQueueMember of matchedQueueMembers) {
    matchedQueueMember.matchedAt = new Date();
    dependencies.queueMemberStore.upsertMany([matchedQueueMember]);
  }

  // Return the Match.
  return match;
}
