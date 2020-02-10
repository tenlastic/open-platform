import * as rabbitmq from '@tenlastic/rabbitmq';
import { Channel, ConsumeMessage } from 'amqplib';

import { RABBITMQ_PREFIX } from '../../constants';
import { File, ReleaseJob, ReleaseJobDocument, ReleaseJobFailure } from '../../models';

export const REMOVE_QUEUE = `${RABBITMQ_PREFIX}.remove`;

export async function removeWorker(
  channel: Channel,
  content: Partial<ReleaseJobDocument>,
  msg: ConsumeMessage,
) {
  try {
    let job = ReleaseJob.hydrate(content);

    // Set Job status to In Progress.
    job.startedAt = new Date();
    job = await job.save();

    for (const path of job.metadata.removed) {
      const { platform, releaseId } = job;
      await File.findOneAndDelete({ path: path.replace(/[\.]+\//g, ''), platform, releaseId });
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
