import { client } from './connect';

export async function getStatus() {
  const health = client.status === 'ready' ? 1 : 0;
  const keys = await client.dbsize();

  return { health, keys };
}
