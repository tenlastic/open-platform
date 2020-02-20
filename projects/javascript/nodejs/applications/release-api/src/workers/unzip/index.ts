import * as minio from '@tenlastic/minio';
import * as rabbitmq from '@tenlastic/rabbitmq';
import { Channel, ConsumeMessage } from 'amqplib';
import * as crypto from 'crypto';
import { Stream } from 'stream';
import * as unzipper from 'unzipper';

import { MINIO_BUCKET, RABBITMQ_PREFIX } from '../../constants';
import {
  File,
  FileDocument,
  FilePlatform,
  Release,
  ReleaseDocument,
  ReleaseTask,
  ReleaseTaskDocument,
  ReleaseTaskFailure,
} from '../../models';

export const UNZIP_QUEUE = `${RABBITMQ_PREFIX}.unzip`;

export async function unzipWorker(
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
    const stream = await minio.getClient().getObject(MINIO_BUCKET, task.minioZipObjectName);

    task = await task.populate({ path: 'releaseDocument' }).execPopulate();
    const release = new Release(task.releaseDocument);
    const promises = await processZip(content.platform, release, stream);
    await Promise.all(promises);

    // Set Job status to Complete.
    task.completedAt = new Date();
    task = await task.save();

    channel.ack(msg);
  } catch (e) {
    console.error(e);

    if (e.name === 'DocumentNotFoundError') {
      channel.ack(msg);
      return;
    }

    const task = await ReleaseTask.findOne({ _id: content._id });
    if (task) {
      const failure = new ReleaseTaskFailure({ createdAt: new Date(), message: e.message });
      task.failures = task.failures.concat(failure);
      task.startedAt = null;
      await task.save();
    }

    await rabbitmq.requeue(channel, msg, { delay: 30 * 1000, retries: 3 });
  }
}

function processZip(platform: FilePlatform, release: ReleaseDocument, stream: Stream) {
  const promises = [];

  return new Promise<Array<Promise<FileDocument>>>((resolve, reject) => {
    stream
      .pipe(unzipper.Parse())
      .on('entry', entry => {
        const { path, type } = entry;
        if (type === 'Directory') {
          return;
        }

        const record = new File({
          path: path.replace(/[\.]+\//g, ''),
          platform,
          releaseId: release._id,
        });

        try {
          const promise = saveFile(entry, record);
          promises.push(promise);
        } catch (e) {
          throw e;
        }
      })
      .on('error', reject)
      .on('finish', () => resolve(promises));
  });
}

async function saveFile(entry: any, record: FileDocument) {
  const results = await Promise.all([
    new Promise((resolve, reject) => {
      const hash = crypto.createHash('md5');
      hash.setEncoding('hex');
      entry.on('end', () => {
        hash.end();

        const md5 = hash.read();
        return resolve(md5);
      });
      entry.on('error', reject);
      entry.pipe(hash);
    }),
    minio.getClient().putObject(MINIO_BUCKET, record.key, entry),
  ]);

  return File.findOneAndUpdate(
    { path: record.path, platform: record.platform, releaseId: record.releaseId },
    {
      compressedBytes: entry.vars.compressedSize,
      md5: results[0],
      path: record.path,
      platform: record.platform,
      releaseId: record.releaseId,
      uncompressedBytes: entry.vars.uncompressedSize,
    },
    { new: true, upsert: true },
  );
}
