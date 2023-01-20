import * as nats from '@tenlastic/nats';

export async function connect(options: nats.ConnectionOptions) {
  return nats.connect({ connectionString: options.connectionString });
}
