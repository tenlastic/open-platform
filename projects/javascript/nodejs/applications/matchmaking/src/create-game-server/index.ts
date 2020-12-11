import { GameServer, GameServerDocument, QueueDocument } from '@tenlastic/mongoose-models';
import * as mongoose from 'mongoose';

/**
 * Create a GameServer.
 */
export async function createGameServer(
  queue: QueueDocument,
  userIds: mongoose.Types.ObjectId[],
): Promise<GameServerDocument> {
  const gameServerTemplate = {
    allowedUserIds: userIds,
    buildId: queue.gameServerTemplate.buildId,
    cpu: queue.gameServerTemplate.cpu,
    description: queue.description,
    isPersistent: false,
    isPreemptible: queue.gameServerTemplate.isPreemptible,
    memory: queue.gameServerTemplate.memory,
    metadata: {
      ...queue.gameServerTemplate.metadata,
      teamAssignments: userIds.join(','),
      teams: queue.teams,
      usersPerTeam: queue.usersPerTeam,
    },
    name: queue.name,
    namespaceId: queue.namespaceId,
    queueId: queue._id,
  };

  await GameServer.checkNamespaceLimits(
    1,
    gameServerTemplate.cpu,
    gameServerTemplate.isPreemptible || false,
    gameServerTemplate.memory,
    gameServerTemplate.namespaceId as any,
  );

  return GameServer.create(gameServerTemplate);
}
