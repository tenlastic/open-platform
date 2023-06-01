import { getJetStreamManager } from '../jet-stream-manager';

export async function deleteConsumer(durable: string, subject: string) {
  const jsm = await getJetStreamManager();
  const stream = subject.split('.')[0];

  return jsm.consumers.delete(stream, durable);
}
