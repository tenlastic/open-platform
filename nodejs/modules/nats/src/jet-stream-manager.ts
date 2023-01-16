import * as nats from 'nats';

import { client } from './connect';

let jetStreamManager: nats.JetStreamManager;

export async function getJetStreamManager(options?: nats.JetStreamOptions) {
  if (jetStreamManager) {
    return jetStreamManager;
  }

  if (!client) {
    throw new Error('Cannot create Jetstream Manager. Connect to NATS first with connect().');
  }

  jetStreamManager = await client.jetstreamManager(options);

  return jetStreamManager;
}
