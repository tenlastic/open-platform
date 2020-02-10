import { Ref } from '@hasezoey/typegoose';
import * as minio from '@tenlastic/minio';
import * as rabbitmq from '@tenlastic/rabbitmq';
import { RecordNotFoundError } from '@tenlastic/web-server';
import { Channel, ConsumeMessage } from 'amqplib';

import { MINIO_BUCKET, RABBITMQ_PREFIX } from '../../constants';
import {
  File,
  ReleaseDocument,
  ReleaseJob,
  ReleaseJobDocument,
  ReleaseJobFailure,
} from '../../models';

export const COPY_QUEUE = `${RABBITMQ_PREFIX}.copy`;

export async function copyWorker(
  channel: Channel,
  content: Partial<ReleaseJobDocument>,
  msg: ConsumeMessage,
) {
  try {
    let job = ReleaseJob.hydrate(content);

    // Set Job status to In Progress.
    job.startedAt = new Date();
    job = await job.save();

    for (const path of job.metadata.unmodified) {
      await copyObject(path, job.platform, job.metadata.previousReleaseId, job.releaseId);
    }

    // Set Job status to Complete.
    job.completedAt = new Date();
    job = await job.save();

    channel.ack(msg);
  } catch (e) {
    if (e.name === 'DocumentNotFoundError') {
      channel.ack(msg);
      return;
    }

    const job = await ReleaseJob.findOne({ _id: content._id });

    const failure = new ReleaseJobFailure({ createdAt: new Date(), message: e.message });
    job.failures = job.failures.concat(failure);
    job.startedAt = null;
    await job.save();

    await rabbitmq.requeue(channel, msg, { delay: 30 * 1000, retries: 3 });
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
      `${releaseId}/${previousFile.platform}/${path}`,
      `${MINIO_BUCKET}/${previousFile.releaseId}/${previousFile.platform}/${path}`,
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
