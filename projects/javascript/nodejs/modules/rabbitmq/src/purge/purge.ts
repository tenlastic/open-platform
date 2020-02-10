import { connection } from '../connect';

export async function purge(queue: string) {
  const channel = await connection.createChannel();

  await channel.assertExchange(queue, 'fanout');
  await channel.assertQueue(queue, { durable: true });
  await channel.bindQueue(queue, queue, '');

  return channel.purgeQueue(queue);
}
