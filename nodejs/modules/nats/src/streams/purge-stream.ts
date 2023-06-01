import { getStream } from './get-stream';
import { getJetStreamManager } from '../jet-stream-manager';

export async function purgeStream(subject: string) {
  const jsm = await getJetStreamManager();
  const name = subject.split('.')[0];

  const stream = getStream(name);
  if (!stream) {
    return null;
  }

  return jsm.streams.purge(name);
}
