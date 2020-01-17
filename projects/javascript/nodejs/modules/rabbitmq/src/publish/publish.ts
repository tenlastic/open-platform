import { connection } from '../connect';

export async function publish(queue: string, msg: any) {
  const channel = await connection.createChannel();

  await channel.assertExchange(queue, 'fanout');
  await channel.assertQueue(queue, { durable: true });
  await channel.bindQueue(queue, queue, '');

  const headers = { 'x-original-queue': queue, 'x-retries': 0 };

  const stringified = JSON.stringify(msg);
  channel.publish(queue, queue, Buffer.from(stringified), { headers, persistent: true });

  channel.close();
}
