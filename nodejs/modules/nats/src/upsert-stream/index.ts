import { getJetStreamManager } from '../connect';

export async function upsertStream(subject: string) {
  const name = subject.split('.')[0];

  // Create stream if it does not already exist.
  const jsm = await getJetStreamManager();
  const streams = await jsm.streams.list().next();
  const stream = streams.find(s => s.config.name === name);
  if (stream) {
    return stream;
  }

  return jsm.streams.add({ name, subjects: [`${name}.>`] });
}
