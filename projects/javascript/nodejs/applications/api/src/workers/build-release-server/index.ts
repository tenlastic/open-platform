import * as docker from '@tenlastic/docker-engine';
import * as minio from '@tenlastic/minio';
import * as rabbitmq from '@tenlastic/rabbitmq';
import { Channel, ConsumeMessage } from 'amqplib';
import * as path from 'path';
import * as tmp from 'tmp';

import { MINIO_BUCKET, RABBITMQ_PREFIX } from '../../constants';
import {
  File,
  Release,
  ReleaseTask,
  ReleaseTaskDocument,
  ReleaseTaskFailure,
  ReleaseTaskAction,
} from '@tenlastic/mongoose-models';

export const BUILD_RELEASE_SERVER_QUEUE = `${RABBITMQ_PREFIX}.build-release-server`;

export async function buildReleaseServerWorker(
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
        await minio.fGetObject(MINIO_BUCKET, file.key, absolutePath);

        tmps.push(file.path);
      }

      // Build
      const release = await Release.findOne({ _id: task.releaseId });
      await docker.build(dir.name, tmps, release.gameId.toString(), task.releaseId.toString());

      // Tag
      const response = await docker.inspect(release.gameId.toString(), task.releaseId.toString());
      await docker.tag(response[0].Id, release.gameId.toString(), task.releaseId.toString());

      // Push
      await docker.push(release.gameId.toString(), task.releaseId.toString());

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
