import * as docker from '@tenlastic/docker-engine';
import * as minio from '@tenlastic/minio';
import {
  File,
  FilePlatform,
  Release,
  ReleaseTask,
  ReleaseTaskDocument,
  ReleaseTaskFailure,
  ReleaseTaskAction,
} from '@tenlastic/mongoose-models';
import * as rabbitmq from '@tenlastic/rabbitmq';
import { Channel, ConsumeMessage } from 'amqplib';
import * as mongoose from 'mongoose';
import * as path from 'path';
import * as tmp from 'tmp';

const QUEUE = `${process.env.RABBITMQ_PREFIX}.build-release-docker-image`;

async function onMessage(
  channel: Channel,
  content: Partial<ReleaseTaskDocument>,
  msg: ConsumeMessage,
) {
  try {
    let task = ReleaseTask.hydrate(content);

    // Do not run if other Tasks for this Release are not complete.
    const count = await ReleaseTask.countDocuments({
      action: { $ne: ReleaseTaskAction.Build },
      completedAt: null,
      failedAt: null,
      releaseId: task.releaseId,
    });
    if (count > 0) {
      channel.nack(msg, false, true);
      return;
    }

    // Set Job status to In Progress.
    task.startedAt = new Date();
    task = await task.save();

    const query = { platform: task.platform, releaseId: task.releaseId };
    const files = await File.find(query);
    if (files.length > 0) {
      const dir = tmp.dirSync();
      const tmps = [];

      for (const file of files) {
        const absolutePath = path.join(dir.name, file.path);
        const minioKey = await file.getMinioKey();
        await minio.fGetObject(process.env.MINIO_BUCKET, minioKey, absolutePath);

        tmps.push(file.path);
      }

      // Build
      const release = await Release.findOne({ _id: task.releaseId });
      await docker.build(dir.name, tmps, release.namespaceId.toString(), task.releaseId.toString());

      // Tag
      const response = await docker.inspect(
        release.namespaceId.toString(),
        task.releaseId.toString(),
      );
      await docker.tag(response[0].Id, release.namespaceId.toString(), task.releaseId.toString());

      // Push
      await docker.push(release.namespaceId.toString(), task.releaseId.toString());

      dir.removeCallback();
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
  releaseId: mongoose.Types.ObjectId,
): Promise<ReleaseTaskDocument> {
  const releaseTask = await ReleaseTask.create({
    action: ReleaseTaskAction.Build,
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

export const BuildReleaseDockerImage = {
  onMessage,
  publish,
  purge,
  subscribe,
};
