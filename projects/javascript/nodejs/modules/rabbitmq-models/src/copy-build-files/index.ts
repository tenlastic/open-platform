import * as minio from '@tenlastic/minio';
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

const QUEUE = `${process.env.RABBITMQ_PREFIX}.copy-build-files`;

async function copyObject(
  path: string,
  platform: string,
  previousBuildId: string,
  buildId: mongoose.Types.ObjectId,
) {
  path = path.replace(/[\.]+\//g, '');

  const previousFile = await File.findOne({ path, platform, buildId: previousBuildId });
  if (!previousFile) {
    throw new Error('Previous File not found.');
  }

  const parameters = {
    buildId,
    compressedBytes: previousFile.compressedBytes,
    md5: previousFile.md5,
    path: previousFile.path,
    platform: previousFile.platform,
    uncompressedBytes: previousFile.uncompressedBytes,
  };
  const currentFile = new File(parameters);

  // Copy the previous file to the new build.
  const bucket = process.env.MINIO_BUCKET;
  const currentFileKey = await currentFile.getMinioKey();
  const previousFileKey = await previousFile.getMinioKey();
  await minio.copyObject(bucket, currentFileKey, `${bucket}/${previousFileKey}`, null);

  return File.findOneAndUpdate(
    { path: previousFile.path, platform: previousFile.platform, buildId },
    parameters,
    { new: true, upsert: true },
  );
}

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

    for (const path of task.metadata.unmodified) {
      await copyObject(
        path,
        task.platform,
        task.metadata.previousBuildId,
        task.buildId as mongoose.Types.ObjectId,
      );
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
  previousBuildId: mongoose.Types.ObjectId | string,
  buildId: mongoose.Types.ObjectId | string,
  unmodified: string[],
): Promise<BuildTaskDocument> {
  const buildTask = await BuildTask.create({
    action: BuildTaskAction.Copy,
    buildId,
    metadata: { previousBuildId, unmodified },
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

export const CopyBuildFiles = {
  onMessage,
  publish,
  purge,
  subscribe,
};
