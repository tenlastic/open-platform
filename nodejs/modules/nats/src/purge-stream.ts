import { getJetStreamManager } from './connect';

export async function purgeStream(subject: string) {
  const name = subject.split('.')[0];

  const jsm = await getJetStreamManager();
  const streams = await jsm.streams.list().next();
  const stream = streams.find((s) => s.config.name === name);

  if (stream) {
    return jsm.streams.purge(name);
  }
}
