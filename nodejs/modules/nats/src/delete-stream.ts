import { getStream } from './get-stream';
import { getJetStreamManager } from './jet-stream-manager';

export async function deleteStream(subject: string) {
  const name = subject.split('.')[0];
  const jsm = await getJetStreamManager();

  const stream = await getStream(name);
  if (!stream) {
    return false;
  }

  const consumers = await jsm.consumers.list(name).next();
  await Promise.all(consumers.map((c) => jsm.consumers.delete(name, c.name)));

  return jsm.streams.delete(name);
}
