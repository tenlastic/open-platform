import * as nats from '@tenlastic/nats';

export interface ConnectOptions extends nats.ConnectionOptions {
  database: string;
}

export async function connect(options: ConnectOptions) {
  await nats.connect({ connectionString: options.connectionString });
  await nats.upsertStream(options.database, { max_age: 0, max_bytes: 250 * 1000 * 1000 });
}
