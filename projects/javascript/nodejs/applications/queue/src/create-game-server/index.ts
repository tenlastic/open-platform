import * as requestPromiseNative from 'request-promise-native';

import { getTeamAssignments } from '../get-team-assignments';

export interface GameServerTemplate {
  buildId: string;
  cpu: number;
  isPreemptible: boolean;
  memory: number;
  metadata: any;
}
export interface Queue {
  _id: string;
  description?: string;
  gameId?: string;
  gameServerTemplate: GameServerTemplate;
  name: string;
  namespaceId: string;
  teams: number;
  usersPerTeam: number;
}
export interface QueueMember {
  _id: string;
  userIds: string[];
}

const accessToken = process.env.ACCESS_TOKEN;

/**
 * Creates a GameServer if enough QueueMembers exist.
 */
export async function createGameServer(queue: Queue, queueMembers: QueueMember[]) {
  // Assign QueueMembers to teams.
  const teamAssignments = getTeamAssignments(queue, queueMembers);

  // Throw an error if not enough teams were found.
  const teams = teamAssignments.length / queue.usersPerTeam;
  if (teams < queue.teams) {
    const count = queueMembers.reduce((a, b) => a + b.userIds.length, 0);
    throw new Error(`Not enough QueueMembers. Teams: ${teams}. Users: ${count}.`);
  }

  // Create the GameServer.
  const gameServer = await requestPromiseNative.post({
    headers: { Authorization: `Bearer ${accessToken}` },
    json: {
      authorizedUserIds: teamAssignments.filter(ta => ta),
      buildId: queue.gameServerTemplate.buildId,
      cpu: queue.gameServerTemplate.cpu,
      description: queue.description,
      gameId: queue.gameId,
      isPersistent: false,
      isPreemptible: queue.gameServerTemplate.isPreemptible,
      memory: queue.gameServerTemplate.memory,
      metadata: {
        ...queue.gameServerTemplate.metadata,
        teamAssignments: teamAssignments.join(','),
        teams: queue.teams,
        usersPerTeam: queue.usersPerTeam,
      },
      name: queue.name,
      namespaceId: queue.namespaceId,
      queueId: queue._id,
    },
    url: `http://api.default:3000/game-servers`,
  });

  // Group matched and unmatched Queue Members.
  const { matched, unmatched } = queueMembers.reduce(
    (previous, current) => {
      if (current.userIds.some(uid => teamAssignments.includes(uid))) {
        previous.matched.push(current);
      } else {
        previous.unmatched.push(current);
      }

      return previous;
    },
    { matched: [], unmatched: [] },
  );

  // Remove matched QueueMembers.
  const promises = matched.map(qm =>
    requestPromiseNative.delete({
      headers: { Authorization: `Bearer ${accessToken}` },
      url: `http://api.default:3000/queue-members/${qm._id}`,
    }),
  );
  await Promise.all(promises);

  // Return unmatched QueueMembers.
  return { gameServer: gameServer.record, queueMembers: unmatched };
}
