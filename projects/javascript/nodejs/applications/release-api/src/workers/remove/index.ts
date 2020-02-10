import * as rabbitmq from '@tenlastic/rabbitmq';
import { Channel, ConsumeMessage } from 'amqplib';

import { RABBITMQ_PREFIX } from '../../constants';
import { File, ReleaseTask, ReleaseTaskDocument, ReleaseTaskFailure } from '../../models';

export const REMOVE_QUEUE = `${RABBITMQ_PREFIX}.remove`;

export async function removeWorker(
  channel: Channel,
  content: Partial<ReleaseTaskDocument>,
  msg: ConsumeMessage,
) {
  try {
    let task = ReleaseTask.hydrate(content);

    // Set Job status to In Progress.
    task.startedAt = new Date();
    task = await task.save();

    for (const path of task.metadata.removed) {
      const { platform, releaseId } = task;
      await File.findOneAndDelete({ path: path.replace(/[\.]+\//g, ''), platform, releaseId });
    }

    // Set Job status to Complete.
    task.completedAt = new Date();
    task = await task.save();

    channel.ack(msg);
  } catch (e) {
    if (e.name === 'DocumentNotFoundError') {
      channel.ack(msg);
      return;
    }

    const task = await ReleaseTask.findOne({ _id: content._id });

    const failure = new ReleaseTaskFailure({ createdAt: new Date(), message: e.message });
    task.failures = task.failures.concat(failure);
    task.startedAt = null;
    await task.save();

    await rabbitmq.requeue(channel, msg, { delay: 30 * 1000, retries: 3 });
  }
}
