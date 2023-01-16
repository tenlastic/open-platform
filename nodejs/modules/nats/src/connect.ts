import * as nats from 'nats';

export interface ConnectionOptions extends nats.ConnectionOptions {
  connectionString?: string;
}

export let client: nats.NatsConnection;

export async function connect(options: ConnectionOptions) {
  if (client) {
    return client;
  }

  if (options.connectionString) {
    const connectionString = decodeURIComponent(options.connectionString);

    if (options.connectionString.includes('@')) {
      const [authentication, servers] = connectionString.split('@');
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
