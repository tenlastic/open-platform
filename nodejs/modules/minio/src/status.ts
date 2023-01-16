import { client } from './connect';

export async function status() {
  const buckets = await client.listBuckets();
  const health = buckets.length > 0 ? 1 : 0;

  return { buckets, health };
}
