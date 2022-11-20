import { StreamConfig } from 'nats';

import { getJetStreamManager } from './connect';

export async function upsertStream(subject: string, options?: Partial<StreamConfig>) {
  const maxAge = 7 * 24 * 60 * 60 * 1000 * 1000 * 1000;
  const name = subject.split('.')[0];
  const subjects = [`${name}.>`];

  const jsm = await getJetStreamManager();
  const streams = await jsm.streams.list().next();
  const stream = streams.find((s) => s.config.name === name);

  if (options && stream) {
    console.log(`Updating NATS stream: ${name}.`);
    return jsm.streams.update(name, { max_age: maxAge, ...options, subjects });
  } else if (stream) {
    return stream;
  }

  console.log(`Creating NATS stream: ${name}.`);
  return jsm.streams.add({ max_age: maxAge, ...options, name, subjects });
}
