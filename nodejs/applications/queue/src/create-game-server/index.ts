import {
  GameServerModel,
  gameServerService,
  QueueModel,
  QueueMemberModel,
  queueMemberService,
  queueMemberStore,
  queueMemberQuery,
} from '@tenlastic/http';

import { getTeamAssignments } from '../get-team-assignments';
import { removeConflictedUsers } from '../remove-conflicted-users';

/**
 * Creates a GameServer if enough QueueMembers exist.
 */
export async function createGameServer(queue: QueueModel): Promise<GameServerModel> {
  // Assign QueueMembers to teams.
  const queueMembers = queueMemberQuery.getAll();
  const teamAssignments = getTeamAssignments(queue, queueMembers);

  // Throw an error if not enough teams were found.
  const teams = teamAssignments.length / queue.usersPerTeam;
  if (teams < queue.teams) {
    const count = queueMembers.reduce((a, b) => a + b.userIds.length, 0);
    throw new Error(`Not enough QueueMembers. Teams: ${teams}. Users: ${count}.`);
  }

  // Get QueueMembers from team assignments.
  const set = new Set<QueueMemberModel>();
  for (const teamAssignment of teamAssignments) {
    const queueMember = queueMembers.find((qm) => qm.userIds.includes(teamAssignment));

    if (queueMember) {
      set.add(queueMember);
    }
  }

  // If any QueueMembers have been removed, retry team assignments.
  const removedQueueMembers = await removeConflictedUsers(queue, Array.from(set));
  if (removedQueueMembers.length) {
    removedQueueMembers.forEach((rqm) => queueMemberStore.remove(rqm._id));
    return createGameServer(queue);
  }

  // Create the GameServer.
  const gameServer = await gameServerService.create(queue.namespaceId, {
    authorizedUserIds: teamAssignments.filter((ta) => ta),
    buildId: queue.gameServerTemplate.buildId,
    cpu: queue.gameServerTemplate.cpu,
    description: queue.description,
    memory: queue.gameServerTemplate.memory,
    metadata: {
      ...queue.gameServerTemplate.metadata,
      teamAssignments: teamAssignments.join(','),
      teams: queue.teams,
      usersPerTeam: queue.usersPerTeam,
    },
    name: queue.name,
    namespaceId: queue.namespaceId,
    persistent: false,
    preemptible: queue.gameServerTemplate.preemptible,
    queueId: queue._id,
  });

  // Remove matched QueueMembers.
  const promises = Array.from(set).map((qm) =>
    queueMemberService.delete(queue.namespaceId, qm._id),
  );
  await Promise.all(promises);

  // Return the GameServer.
  return gameServer;
}
