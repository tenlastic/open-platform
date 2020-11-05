import * as docker from '@tenlastic/docker-engine';
import * as minio from '@tenlastic/minio';
import {
  File,
  FilePlatform,
  Build,
  BuildTask,
  BuildTaskDocument,
  BuildTaskFailure,
  BuildTaskAction,
} from '@tenlastic/mongoose-models';
import * as rabbitmq from '@tenlastic/rabbitmq';
import { Channel, ConsumeMessage } from 'amqplib';
import * as mongoose from 'mongoose';
import * as path from 'path';
import * as tmp from 'tmp';

const QUEUE = `${process.env.RABBITMQ_PREFIX}.build-docker-image`;

async function onMessage(
  channel: Channel,
  content: Partial<BuildTaskDocument>,
  msg: ConsumeMessage,
) {
  try {
    let task = BuildTask.hydrate(content);

    // Do not run if other Tasks for this Build are not complete.
    const count = await BuildTask.countDocuments({
      action: { $ne: BuildTaskAction.Build },
      buildId: task.buildId,
      completedAt: null,
      failedAt: null,
    });
    if (count > 0) {
      channel.nack(msg, false, true);
      return;
    }

    // Set Job status to In Progress.
    task.startedAt = new Date();
    task = await task.save();

    const query = { platform: task.platform, buildId: task.buildId };
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
      const build = await Build.findOne({ _id: task.buildId });
      await docker.build(dir.name, tmps, build.namespaceId.toString(), task.buildId.toString());

      // Tag
      const response = await docker.inspect(build.namespaceId.toString(), task.buildId.toString());
      await docker.tag(response[0].Id, build.namespaceId.toString(), task.buildId.toString());

      // Push
      await docker.push(build.namespaceId.toString(), task.buildId.toString());

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
  buildId: mongoose.Types.ObjectId,
): Promise<BuildTaskDocument> {
  const buildTask = await BuildTask.create({
    action: BuildTaskAction.Build,
    buildId,
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

export const BuildDockerImage = {
  onMessage,
  publish,
  purge,
  subscribe,
};
