import {
  File,
  FilePlatform,
  ReleaseTask,
  ReleaseTaskAction,
  ReleaseTaskDocument,
  ReleaseTaskFailure,
} from '@tenlastic/mongoose-models';
import * as rabbitmq from '@tenlastic/rabbitmq';
import { Channel, ConsumeMessage } from 'amqplib';
import * as mongoose from 'mongoose';

const QUEUE = `${process.env.RABBITMQ_PREFIX}.delete-release-files`;

async function onMessage(
  channel: Channel,
  content: Partial<ReleaseTaskDocument>,
  msg: ConsumeMessage,
) {
  try {
    let task = ReleaseTask.hydrate(content);

    // Set Job status to In Progress.
    task.startedAt = new Date();
    task = await task.save();

    for (const path of task.metadata.removed) {
      const { platform, releaseId } = task;
      await File.findOneAndDelete({ path: path.replace(/[\.]+\//g, ''), platform, releaseId });
    }

    // Set Job status to Complete.
    task.completedAt = new Date();
    task = await task.save();

    channel.ack(msg);
  } catch (e) {
    if (process.env.NODE_ENV !== 'test') {
      console.error(e);
    }

    if (e.name === 'DocumentNotFoundError') {
      channel.ack(msg);
      return;
    }

    const wasRequeued = await rabbitmq.requeue(channel, msg, { delay: 30 * 1000, retries: 3 });

    const task = await ReleaseTask.findOne({ _id: content._id });
    if (task) {
      const failure = new ReleaseTaskFailure({ createdAt: new Date(), message: e.message });
      task.failedAt = wasRequeued ? null : new Date();
      task.failures = task.failures.concat(failure);
      task.startedAt = null;
      await task.save();
    }
  }
}

async function publish(
  platform: FilePlatform,
  releaseId: mongoose.Types.ObjectId | string,
  removed: string[],
): Promise<ReleaseTaskDocument> {
  const releaseTask = await ReleaseTask.create({
    action: ReleaseTaskAction.Remove,
    metadata: { removed },
    platform,
    releaseId,
  });
  await rabbitmq.publish(QUEUE, releaseTask);

  return releaseTask;
}

function purge() {
  return rabbitmq.purge(QUEUE);
}

function subscribe() {
  return rabbitmq.consume(QUEUE, onMessage);
}

export const DeleteReleaseFiles = {
  onMessage,
  publish,
  purge,
  subscribe,
};
