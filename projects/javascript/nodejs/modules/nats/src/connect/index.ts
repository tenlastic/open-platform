import * as nats from 'nats';

export interface ConnectionOptions extends nats.ConnectionOptions {
  connectionString?: string;
}

let client: nats.NatsConnection;
let jetStream: nats.JetStreamClient;
let jetStreamManager: nats.JetStreamManager;

export async function connect(options: ConnectionOptions) {
  if (client) {
    return client;
  }

  if (options.connectionString) {
    if (options.connectionString.includes('@')) {
      const [authentication, servers] = options.connectionString.split['@'];
      const [user, pass] = authentication.split(':');

      options.pass = pass;
      options.servers = servers.split(',');
      options.user = user;
    } else {
      options.servers = options.connectionString.split(',');
    }
  }

  client = await nats.connect(options);
  return client;
}

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
