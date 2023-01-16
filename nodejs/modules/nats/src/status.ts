import { client } from './connect';
import { getJetStreamManager } from './jet-stream-manager';

export async function status() {
  const health = client.isClosed() ? 0 : 1;

  const jetSteamManager = await getJetStreamManager();
  const streams = await jetSteamManager.streams.list().next();

  return { health, streams };
}
