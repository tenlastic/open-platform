import { Ref } from '@hasezoey/typegoose';
import {
  NamespaceLimitError,
  Queue,
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
  console.log(`Received QueueMember event for queue: ${payload.fullDocument.queueId}.`);

  const queue = await Queue.findOne({ _id: payload.fullDocument.queueId });
  console.log(`Queue name: ${queue.name}. Queue Game ID: ${queue.namespaceId}.`);

  // Assign QueueMembers to teams.
  const queueMembers = await QueueMember.find({ queueId: queue._id });
  const teamAssignments = getTeamAssignments(queue, queueMembers);
  if (teamAssignments.length < queue.teams) {
    return;
  }

  // Create the GameServer.
  const flatTeamAssignments: Array<Ref<UserDocument>> = [].concat.apply([], teamAssignments);
  try {
    const gameServer = await createGameServer(queue, flatTeamAssignments);
    console.log(`GameServer created successfully: ${gameServer._id}.`);
  } catch (e) {
    switch (e.constructor) {
      case NamespaceLimitError:
        return;

      case UniquenessError:
        await removeConflictedUsers(queue, flatTeamAssignments);
        console.log(`Users removed from other queues: ${flatTeamAssignments.join(', ')}.`);
        break;

      default:
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
