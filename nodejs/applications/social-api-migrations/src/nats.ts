import { connect, upsertStream } from '@tenlastic/nats';

export async function nats(connectionString: string, maxBytes: number, subject: string) {
  await connect({ connectionString });

  const max_bytes = maxBytes;
  const num_replicas = process.env.NATS_REPLICAS ? Number(process.env.NATS_REPLICAS) : 1;

  console.log('Upserting stream...');
  await upsertStream(subject, { max_bytes, num_replicas });
  console.log('Upserted stream successfully!');
}
