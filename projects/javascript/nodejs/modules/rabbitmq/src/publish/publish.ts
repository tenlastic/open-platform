import { connection } from '../connect';

export async function publish(queue: string, msg: any) {
  const channel = await connection.createChannel();
  console.log('Channel created.');

  await channel.assertExchange(queue, 'fanout');
  console.log('Exchange asserted.');
  await channel.assertQueue(queue, { durable: true });
  console.log('Queue asserted.');
  await channel.bindQueue(queue, queue, '');
  console.log('Queue bound.');

  const headers = { 'x-original-queue': queue, 'x-retries': 0 };

  const stringified = typeof msg === 'string' ? msg : JSON.stringify(msg);
  channel.publish(queue, queue, Buffer.from(stringified), { headers, persistent: true });
  console.log('Message published.');

  channel.close();
}
