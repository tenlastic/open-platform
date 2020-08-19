import { GameServer, Queue, QueueMember } from '@tenlastic/mongoose-models';

export async function matchmake(queueId: string) {
  console.log(`Received QueueMember event for queue: ${queueId}.`);

  const queue = await Queue.findOne({ _id: queueId });
  console.log(`Queue name: ${queue.name}. Queue Game ID: ${queue.gameId}.`);

  // Check to see if enough Users are queued.
  const threshold = queue.teams * queue.usersPerTeam;
  const queueMembers = await QueueMember.find({ queueId: queue._id }).limit(threshold);
  console.log(`Threshold: ${threshold}. QueueMembers: ${queueMembers.length}.`);
  if (queueMembers.length < threshold) {
    return;
  }

  // Create the Game Server.
  const gameServer = await GameServer.create({
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
  console.log(`GameServer created successfully: ${gameServer._id}.`);

  await Promise.all(queueMembers.map(qm => qm.remove()));
  console.log('QueueMembers removed successfully.');
}
