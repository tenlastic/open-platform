import { Ref } from '@hasezoey/typegoose';
import {
  NamespaceLimitError,
  Queue,
  QueueDocument,
  QueueLog,
  QueueMember,
  QueueMemberDocument,
  UserDocument,
} from '@tenlastic/mongoose-models';
import { IDatabasePayload } from '@tenlastic/mongoose-change-stream';
import { UniquenessError } from '@tenlastic/mongoose-unique-error';

import { createGameServer } from '../create-game-server';
import { getTeamAssignments } from '../get-team-assignments';
import { removeConflictedUsers } from '../remove-conflicted-users';

export async function matchmake(payload: IDatabasePayload<Partial<QueueMemberDocument>>) {
  const { queueId } = payload.fullDocument;
  console.log(`QueueMember event for Queue: ${queueId}.`);

  const queue = await Queue.findOne({ _id: queueId });
  console.log(`Queue name: ${queue.name}. Queue Namespace ID: ${queue.namespaceId}.`);

  // Assign QueueMembers to teams.
  const queueMembers = await QueueMember.find({ queueId: queue._id });
  const teamAssignments = getTeamAssignments(queue, queueMembers);
  if (teamAssignments.length < queue.teams) {
    const count = await QueueMember.getUserIdCount({ queueId: queue._id });
    await createQueueLog(
      `Not enough QueueMembers. QueueMembers: ${count}. Teams: ${teamAssignments.length}.`,
      queueId,
    );
    return;
  }

  // Create the GameServer.
  const flatTeamAssignments: Array<Ref<UserDocument>> = [].concat.apply([], teamAssignments);
  try {
    const gameServer = await createGameServer(queue, flatTeamAssignments);
    await createQueueLog(`GameServer created successfully: ${gameServer._id}.`, queueId);
  } catch (e) {
    switch (e.constructor) {
      case NamespaceLimitError:
        await createQueueLog(e.message, queueId);
        return;

      case UniquenessError:
        await removeConflictedUsers(queue, flatTeamAssignments);
        console.log(`Users removed from other queues: ${flatTeamAssignments.join(', ')}.`);
        break;

      default:
        await createQueueLog(e.message, queueId);
        throw e;
    }
  }

  await Promise.all(queueMembers.map(qm => qm.remove()));
  console.log('QueueMembers removed successfully.');

  const userIds = queueMembers.map(qm => qm.userId);
  const otherQueueMembers = await QueueMember.find({ userId: { $in: userIds } });
  await Promise.all(otherQueueMembers.map(qm => qm.remove()));
  console.log('Users removed from other queues.');
}

async function createQueueLog(body: string, queueId: Ref<QueueDocument>) {
  console.log(body);

  try {
    await QueueLog.create({ body, queueId, unix: Date.now() });
  } catch {}
}
