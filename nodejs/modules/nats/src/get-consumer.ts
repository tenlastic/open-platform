import { getJetStreamManager } from './jet-stream-manager';

export async function getConsumer(durable: string, subject: string) {
  const jsm = await getJetStreamManager();
  const stream = subject.split('.')[0];

  try {
    return await jsm.consumers.info(stream, durable);
  } catch (e) {
    if (e.code !== '404' || e.name !== 'NatsError') {
      throw e;
    }

    return null;
  }
}
