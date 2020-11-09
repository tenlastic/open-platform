import { Queue, QueueMember, QueueMemberDocument } from '@tenlastic/mongoose-models';
import { IDatabasePayload } from '@tenlastic/mongoose-change-stream';

import { createGameServer } from '../create-game-server';

export async function matchmake(payload: IDatabasePayload<Partial<QueueMemberDocument>>) {
  console.log(`Received QueueMember event for queue: ${payload.fullDocument.queueId}.`);

  const queue = await Queue.findOne({ _id: payload.fullDocument.queueId });
  console.log(`Queue name: ${queue.name}. Queue Game ID: ${queue.namespaceId}.`);

  // Check to see if enough Users are queued.
  const threshold = queue.teams * queue.usersPerTeam;
  const queueMembers = await QueueMember.find({ queueId: queue._id }).limit(threshold);
  console.log(`Threshold: ${threshold}. QueueMembers: ${queueMembers.length}.`);
  if (queueMembers.length < threshold) {
    return;
  }

  const gameServerCreatedSuccessfully = await createGameServer(queue, queueMembers);
  if (!gameServerCreatedSuccessfully) {
    return;
  }

  await Promise.all(queueMembers.map(qm => qm.remove()));
  console.log('QueueMembers removed successfully.');

  const userIds = queueMembers.map(qm => qm.userId);
  const otherQueueMembers = await QueueMember.find({ userId: { $in: userIds } });
  await Promise.all(otherQueueMembers.map(qm => qm.remove()));
  console.log('Users removed from other queues.');
}
