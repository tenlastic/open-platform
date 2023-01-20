import { connect, upsertStream } from '@tenlastic/nats';

export async function nats(connectionString: string, maxBytes: number, subject: string) {
  await connect({ connectionString });

  console.log('Upserting stream...');
  await upsertStream(subject, { max_bytes: maxBytes });
  console.log('Upserted stream successfully!');
}
