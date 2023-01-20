import * as nats from '@tenlastic/mongoose-nats';
import { NatsConnection } from 'nats';

export interface SetupOptions {
  connectionString: string;
  database: string;
}

export async function setup(options: SetupOptions) {
  const client = await nats.connect({ connectionString: options.connectionString });
  nats.subscribe({ database: options.database }).catch((err) => {
    console.error(err);
    process.exit(1);
  });
  status(client).catch((err) => {
    console.error(err);
    process.exit(1);
  });
}

async function status(client: NatsConnection) {
  for await (const s of client.status()) {
    console.log({ data: s.data, type: s.type });
  }
}
