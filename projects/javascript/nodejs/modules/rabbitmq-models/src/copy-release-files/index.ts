import * as minio from '@tenlastic/minio';
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

const QUEUE = `${process.env.RABBITMQ_PREFIX}.copy-release-files`;

async function copyObject(
  path: string,
  platform: string,
  previousReleaseId: string,
  releaseId: mongoose.Types.ObjectId,
) {
  path = path.replace(/[\.]+\//g, '');

  const previousFile = await File.findOne({ path, platform, releaseId: previousReleaseId });
  if (!previousFile) {
    throw new Error('Previous File not found.');
  }

  // Copy the previous file to the new release.
  const bucket = process.env.MINIO_BUCKET;
  await minio.copyObject(
    bucket,
    `releases/${releaseId}/${previousFile.platform}/${path}`,
    `${bucket}/releases/${previousFile.releaseId}/${previousFile.platform}/${path}`,
    null,
  );

  return File.findOneAndUpdate(
    { path: previousFile.path, platform: previousFile.platform, releaseId },
    {
      compressedBytes: previousFile.compressedBytes,
      md5: previousFile.md5,
      path: previousFile.path,
      platform: previousFile.platform,
      releaseId,
      uncompressedBytes: previousFile.uncompressedBytes,
    },
    { new: true, upsert: true },
  );
}

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

    for (const path of task.metadata.unmodified) {
      await copyObject(
        path,
        task.platform,
        task.metadata.previousReleaseId,
        task.releaseId as mongoose.Types.ObjectId,
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
  previousReleaseId: mongoose.Types.ObjectId | string,
  releaseId: mongoose.Types.ObjectId | string,
  unmodified: string[],
): Promise<ReleaseTaskDocument> {
  const releaseTask = await ReleaseTask.create({
    action: ReleaseTaskAction.Copy,
    metadata: { previousReleaseId, unmodified },
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

export const CopyReleaseFiles = {
  onMessage,
  publish,
  purge,
  subscribe,
};
