import * as nats from 'nats';

import { client } from './connect';

let jetStream: nats.JetStreamClient;

export function getJetStream(options?: nats.JetStreamOptions) {
  if (jetStream) {
    return jetStream;
  }

  if (!client) {
    throw new Error('Cannot create Jetstream. Connect to NATS first with connect().');
  }

  jetStream = client.jetstream(options);

  return jetStream;
}
