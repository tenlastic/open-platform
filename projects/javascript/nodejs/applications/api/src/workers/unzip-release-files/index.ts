import * as minio from '@tenlastic/minio';
import * as rabbitmq from '@tenlastic/rabbitmq';
import { Channel, ConsumeMessage } from 'amqplib';
import * as crypto from 'crypto';
import * as unzipper from 'unzipper';

import { MINIO_BUCKET, RABBITMQ_PREFIX } from '../../constants';
import {
  File,
  FileDocument,
  FilePlatform,
  Release,
  ReleaseTask,
  ReleaseTaskDocument,
  ReleaseTaskFailure,
} from '../../models';

export const UNZIP_RELEASE_FILES_QUEUE = `${RABBITMQ_PREFIX}.unzip-release-files`;

export async function unzipReleaseFilesWorker(
  channel: Channel,
  content: Partial<ReleaseTaskDocument>,
  msg: ConsumeMessage,
) {
  try {
    let task = ReleaseTask.hydrate(content);

    // Set Job status to In Progress.
    task.startedAt = new Date();
    task = await task.save();

    // Read the zip from Minio and unzip the files back to Minio.
    const stream = await minio.getObject(MINIO_BUCKET, task.minioZipObjectName);

    task = await task.populate({ path: 'releaseDocument' }).execPopulate();
    const release = new Release(task.releaseDocument);

    // Process the zip.
    const zip = stream.pipe(unzipper.Parse({ forceStream: true }));
    for await (const entry of zip) {
      const { path, type } = entry;
      if (type === 'Directory') {
        continue;
      }

      const record = new File({
        path: path.replace(/[\.]+\//g, ''),
        platform: content.platform as FilePlatform,
        releaseId: release._id,
      });

      const buffer: Buffer = await entry.buffer();
      await saveFile(buffer, entry, record);
    }

    // Remove Zip.
    await minio.removeObject(MINIO_BUCKET, task.minioZipObjectName);

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

async function saveFile(content: Buffer, entry: any, record: FileDocument) {
  const md5 = crypto
    .createHash('md5')
    .update(content)
    .digest('hex');

  await minio.putObject(MINIO_BUCKET, record.key, content);

  return File.findOneAndUpdate(
    { path: record.path, platform: record.platform, releaseId: record.releaseId },
    {
      compressedBytes: entry.vars.compressedSize,
      md5,
      path: record.path,
      platform: record.platform,
      releaseId: record.releaseId,
      uncompressedBytes: entry.vars.uncompressedSize,
    },
    { new: true, upsert: true },
  );
}
