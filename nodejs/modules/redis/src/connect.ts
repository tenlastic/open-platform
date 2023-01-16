import Redis from 'ioredis';

export interface ConnectOptions {
  connectionString: string;
  name: string;
  password: string;
}

export let client: Redis;

export function connect(options: ConnectOptions) {
  const sentinels = options.connectionString.split(',').map((rcs) => {
    const [host, port] = rcs.split(':');
    return { host, port: Number(port) };
  });

  client = new Redis({
    name: options.name,
    password: options.password,
    retryStrategy: (times) => Math.min(times * 1000, 5000),
    sentinelPassword: options.password,
    sentinels,
  });

  return new Promise<Redis>((resolve, reject) => {
    client.on('connect', () => resolve(client));
    client.on('error', reject);
  });
}
