import * as minio from '@tenlastic/minio';
import * as rabbitmq from '@tenlastic/rabbitmq';
import { Channel, ConsumeMessage } from 'amqplib';
import * as fs from 'fs';
import * as path from 'path';
import * as request from 'request-promise-native';
import * as tar from 'tar';
import * as tmp from 'tmp';

import { MINIO_BUCKET, RABBITMQ_PREFIX } from '../../constants';
import {
  File,
  Release,
  ReleaseTask,
  ReleaseTaskDocument,
  ReleaseTaskFailure,
  ReleaseTaskAction,
} from '../../models';

export const BUILD_QUEUE = `${RABBITMQ_PREFIX}.build`;

export async function buildWorker(
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
        await minio.getClient().fGetObject(MINIO_BUCKET, file.key, absolutePath);

        tmps.push(file.path);
      }

      const options: Partial<request.OptionsWithUrl> = {};
      if (process.env.DOCKER_CERT_PATH) {
        options.ca = fs.readFileSync(`${process.env.DOCKER_CERT_PATH}/ca.pem`);
        options.cert = fs.readFileSync(`${process.env.DOCKER_CERT_PATH}/cert.pem`);
        options.key = fs.readFileSync(`${process.env.DOCKER_CERT_PATH}/key.pem`);
        options.rejectUnauthorized = false;
      }

      const stream = tar.create({ cwd: dir.name }, tmps);

      const dockerEngineUrl = process.env.DOCKER_ENGINE_URL;
      const release = await Release.findOne({ _id: task.releaseId });
      const tag = `${release.gameId}:${task.releaseId}`;
      await request.post({
        ...options,
        body: stream,
        url: `${dockerEngineUrl}/build?t=${tag}`,
      });

      const response = await request.get({
        ...options,
        json: true,
        url: `${dockerEngineUrl}/images/json?filters={"reference":["${tag}"]}`,
      });

      const id = response[0].Id;
      const url = new URL(process.env.DOCKER_REGISTRY_URL);
      const repo = `${url.host}/${release.gameId}`;
      await request.post({
        ...options,
        url: `${dockerEngineUrl}/images/${id}/tag?repo=${repo}&tag=${task.releaseId}`,
      });

      const credentials = JSON.stringify({
        password: url.password,
        serveraddress: url.host,
        username: url.username,
      });
      const xRegistryAuth = Buffer.from(credentials).toString('base64');
      await request.post({
        ...options,
        headers: { 'X-Registry-Auth': xRegistryAuth },
        url: `${dockerEngineUrl}/images/${repo}/push?tag=${task.releaseId}`,
      });

      dir.removeCallback();
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
