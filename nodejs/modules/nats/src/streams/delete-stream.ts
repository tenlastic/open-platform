import { getJetStreamManager } from '../jet-stream-manager';
import { getStream } from './get-stream';

export async function deleteStream(subject: string) {
  const name = subject.split('.')[0];
  const jsm = await getJetStreamManager();

  const stream = await getStream(name);
  if (!stream) {
    return false;
  }

  return jsm.streams.delete(name);
}
