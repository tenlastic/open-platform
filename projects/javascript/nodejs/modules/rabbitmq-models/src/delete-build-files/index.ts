import {
  File,
  FilePlatform,
  BuildTask,
  BuildTaskAction,
  BuildTaskDocument,
  BuildTaskFailure,
} from '@tenlastic/mongoose-models';
import * as rabbitmq from '@tenlastic/rabbitmq';
import { Channel, ConsumeMessage } from 'amqplib';
import * as mongoose from 'mongoose';

const QUEUE = `${process.env.RABBITMQ_PREFIX}.delete-build-files`;

async function onMessage(
  channel: Channel,
  content: Partial<BuildTaskDocument>,
  msg: ConsumeMessage,
) {
  try {
    let task = BuildTask.hydrate(content);

    // Set Job status to In Progress.
    task.startedAt = new Date();
    task = await task.save();

    for (const path of task.metadata.removed) {
      const { platform, buildId } = task;
      await File.findOneAndDelete({ path: path.replace(/[\.]+\//g, ''), platform, buildId });
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

    const task = await BuildTask.findOne({ _id: content._id });
    if (task) {
      const failure = new BuildTaskFailure({ createdAt: new Date(), message: e.message });
      task.failedAt = wasRequeued ? null : new Date();
      task.failures = task.failures.concat(failure);
      task.startedAt = null;
      await task.save();
    }
  }
}

async function publish(
  platform: FilePlatform,
  buildId: mongoose.Types.ObjectId | string,
  removed: string[],
): Promise<BuildTaskDocument> {
  const buildTask = await BuildTask.create({
    action: BuildTaskAction.Remove,
    buildId,
    metadata: { removed },
    platform,
  });
  await rabbitmq.publish(QUEUE, buildTask);

  return buildTask;
}

function purge() {
  return rabbitmq.purge(QUEUE);
}

function subscribe() {
  return rabbitmq.consume(QUEUE, onMessage);
}

export const DeleteBuildFiles = {
  onMessage,
  publish,
  purge,
  subscribe,
};
