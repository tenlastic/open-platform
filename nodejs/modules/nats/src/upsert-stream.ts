import { StreamConfig, StreamInfo } from 'nats';

import { getJetStreamManager } from './connect';

export async function upsertStream(subject: string, options?: Partial<StreamConfig>) {
  const maxAge = 7 * 24 * 60 * 60 * 1000 * 1000 * 1000;
  const name = subject.split('.')[0];
  const subjects = [`${name}.>`];

  const jsm = await getJetStreamManager();
  let stream: StreamInfo;

  try {
    stream = await jsm.streams.add({ max_age: maxAge, ...options, name, subjects });
    console.log(`Created NATS stream: ${name}.`);
  } catch (e) {
    if (e.api_error?.code !== 400 || e.api_error?.err_code !== 10058) {
      throw e;
    }

    stream = await jsm.streams.update(name, { max_age: maxAge, ...options, subjects });
    console.log(`Updated NATS stream: ${name}.`);
  }

  return stream;
}
