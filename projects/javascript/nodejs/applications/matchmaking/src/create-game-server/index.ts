import {
  GameServer,
  QueueDocument,
  QueueMember,
  QueueMemberDocument,
} from '@tenlastic/mongoose-models';
import { UniquenessError } from '@tenlastic/mongoose-unique-error';

/**
 * Create a GameServer.
 * If a User is already in a match, remove them from other Queues.
 */
export async function createGameServer(queue: QueueDocument, queueMembers: QueueMemberDocument[]) {
  const userIds = queueMembers.map(qm => qm.userId);

  try {
    const gameServer = await GameServer.create({
      allowedUserIds: userIds,
      buildId: queue.gameServerTemplate.buildId,
      description: queue.description,
      isPersistent: false,
      isPreemptible: queue.gameServerTemplate.isPreemptible,
      metadata: {
        ...queue.gameServerTemplate.metadata,
        teamAssignments: userIds.join(','),
        teams: queue.teams,
        usersPerTeam: queue.usersPerTeam,
      },
      name: queue.name,
      namespaceId: queue.namespaceId,
      queueId: queue._id,
    });
    console.log(`GameServer created successfully: ${gameServer._id}.`);
  } catch (e) {
    if (e instanceof UniquenessError === false) {
      throw e;
    }

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
    await Promise.all(otherQueueMembers.map(qm => qm.remove()));
    console.log('Users removed from other queues.');
  }
}
