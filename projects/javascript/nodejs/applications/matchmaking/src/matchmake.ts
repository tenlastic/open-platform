import { GameServer, Queue, QueueMember } from '@tenlastic/mongoose-models';

export async function matchmake(queueId: string) {
  const queue = await Queue.findOne({ _id: queueId });

  // Check to see if enough Users are queued.
  const threshold = queue.teams * queue.usersPerTeam;
  const queueMembers = await QueueMember.find({ queueId: queue._id }).limit(threshold);
  if (queueMembers.length < threshold) {
    return;
  }

  // Create the Game Server.
  await GameServer.create({
    allowedUserIds: queueMembers.map(qm => qm.userId),
    description: queue.gameServerTemplate.description,
    gameId: queue.gameId,
    isPersistent: false,
    isPreemptible: queue.gameServerTemplate.isPreemptible,
    metadata: {
      ...queue.gameServerTemplate.metadata,
      teamAssignments: queueMembers.map(qm => qm.userId).join(','),
      teams: queue.teams,
      usersPerTeam: queue.usersPerTeam,
    },
    name: queue.gameServerTemplate.name,
    queueId: queue._id,
    releaseId: queue.gameServerTemplate.releaseId,
  });

  await Promise.all(queueMembers.map(qm => qm.remove()));
}
