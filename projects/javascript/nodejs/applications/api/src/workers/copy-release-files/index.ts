import { Ref } from '@hasezoey/typegoose';
import * as minio from '@tenlastic/minio';
import * as rabbitmq from '@tenlastic/rabbitmq';
import { RecordNotFoundError } from '@tenlastic/web-server';
import { Channel, ConsumeMessage } from 'amqplib';

import { MINIO_BUCKET, RABBITMQ_PREFIX } from '../../constants';
import {
  File,
  ReleaseDocument,
  ReleaseTask,
  ReleaseTaskDocument,
  ReleaseTaskFailure,
} from '../../models';

export const COPY_RELEASE_FILES_QUEUE = `${RABBITMQ_PREFIX}.copy-release-files`;

export async function copyReleaseFilesWorker(
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
      await copyObject(path, task.platform, task.metadata.previousReleaseId, task.releaseId);
    }

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

async function copyObject(
  path: string,
  platform: string,
  previousReleaseId: string,
  releaseId: Ref<ReleaseDocument>,
) {
  path = path.replace(/[\.]+\//g, '');

  const previousFile = await File.findOne({ path, platform, releaseId: previousReleaseId });
  if (!previousFile) {
    throw new RecordNotFoundError('Previous File');
  }

  // Copy the previous file to the new release.
  await minio
    .getClient()
    .copyObject(
      MINIO_BUCKET,
      `releases/${releaseId}/${previousFile.platform}/${path}`,
      `${MINIO_BUCKET}/releases/${previousFile.releaseId}/${previousFile.platform}/${path}`,
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
