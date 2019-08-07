import { connection } from '../connect';

export async function purge(queue: string) {
  const channel = await connection.createChannel();

  return channel.purgeQueue(queue);
}
