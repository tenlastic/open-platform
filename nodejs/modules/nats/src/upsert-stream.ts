import { StreamConfig, StreamInfo } from 'nats';

import { getJetStreamManager } from './jet-stream-manager';

export async function upsertStream(subject: string, options?: Partial<StreamConfig>) {
  const jsm = await getJetStreamManager();

  const max_age = 7 * 24 * 60 * 60 * 1000 * 1000 * 1000;
  const name = subject.split('.')[0];
  const num_replicas = process.env.NATS_REPLICAS ? Number(process.env.NATS_REPLICAS) : 1;
  const subjects = [`${name}.>`];

  let stream: StreamInfo;
  try {
    stream = await jsm.streams.add({ max_age, num_replicas, ...options, name, subjects });
  } catch (e) {
    if (e.api_error?.code !== 400 || e.api_error?.err_code !== 10058) {
      throw e;
    }

    stream = await jsm.streams.update(name, { max_age, ...options, subjects });
  }

  return stream;
}
