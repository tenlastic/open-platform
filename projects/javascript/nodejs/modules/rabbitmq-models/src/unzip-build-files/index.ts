import * as minio from '@tenlastic/minio';
import {
  File,
  FileDocument,
  FilePlatform,
  Build,
  BuildTask,
  BuildTaskAction,
  BuildTaskDocument,
  BuildTaskFailure,
} from '@tenlastic/mongoose-models';
import * as rabbitmq from '@tenlastic/rabbitmq';
import { Channel, ConsumeMessage } from 'amqplib';
import * as mongoose from 'mongoose';
import * as crypto from 'crypto';
import * as unzipper from 'unzipper';

import { Stream } from 'stream';

const QUEUE = `${process.env.RABBITMQ_PREFIX}.unzip-build-files`;

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

    // Read the zip from Minio and unzip the files back to Minio.
    const minioZipPath = await task.getMinioKey();
    const stream = await minio.getObject(process.env.MINIO_BUCKET, minioZipPath);

    task = await task.populate({ path: 'buildDocument' }).execPopulate();
    const build = new Build(task.buildDocument);

    // Process the zip.
    const zip = stream.pipe(unzipper.Parse({ forceStream: true }));
    for await (const entry of zip) {
      const { path, type } = entry;
      if (type === 'Directory') {
        continue;
      }

      const record = new File({
        buildId: build._id,
        path: path.replace(/[\.]+\//g, ''),
        platform: content.platform as FilePlatform,
      });

      const buffer: Buffer = await entry.buffer();
      await saveFile(buffer, entry, record);
    }

    // Remove Zip.
    const minioKey = await task.getMinioKey();
    await minio.removeObject(process.env.MINIO_BUCKET, minioKey);

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
  stream: Stream,
): Promise<BuildTaskDocument> {
  const buildTask = await BuildTask.create({
    action: BuildTaskAction.Unzip,
    buildId,
    platform,
  });

  const minioKey = await buildTask.getMinioKey();
  await minio.putObject(process.env.MINIO_BUCKET, minioKey, stream);
  await rabbitmq.publish(QUEUE, buildTask);

  return buildTask;
}

function purge() {
  return rabbitmq.purge(QUEUE);
}

async function saveFile(content: Buffer, entry: any, record: FileDocument) {
  const md5 = crypto
    .createHash('md5')
    .update(content)
    .digest('hex');

  const minioKey = await record.getMinioKey();
  await minio.putObject(process.env.MINIO_BUCKET, minioKey, content);

  return File.findOneAndUpdate(
    { path: record.path, platform: record.platform, buildId: record.buildId },
    {
      buildId: record.buildId,
      compressedBytes: entry.vars.compressedSize,
      md5,
      path: record.path,
      platform: record.platform,
      uncompressedBytes: entry.vars.uncompressedSize,
    },
    { new: true, upsert: true },
  );
}

function subscribe() {
  return rabbitmq.consume(QUEUE, onMessage);
}

export const UnzipBuildFiles = {
  onMessage,
  publish,
  purge,
  subscribe,
};
