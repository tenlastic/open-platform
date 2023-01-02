import * as nats from '@tenlastic/nats';

export async function connect(options: nats.ConnectionOptions) {
  await nats.connect({ connectionString: options.connectionString });
}
