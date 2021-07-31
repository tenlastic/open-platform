import * as amqp from 'amqplib';

import { connection, events } from '../connect';

export async function consume(
  queue: string,
  onMessage: (channel: amqp.Channel, content: any, msg: amqp.ConsumeMessage) => void,
) {
  const channel = await connection.createChannel();
  console.log('Channel created.');
  await channel.assertQueue(queue, { durable: true });
  console.log('Exchange asserted.');

  await channel.prefetch(1);
  console.log('Prefetched channel.');

  channel.consume(queue, msg => {
    const content = msg.content.toString('utf8');
    const parsed = JSON.parse(content);

    onMessage(channel, parsed, msg);
  });

  // Resubscibe on reconnect.
  events.once('connect', () => consume(queue, onMessage));
  console.log(`Subscribed to RabbitMQ queue: ${queue}.`);
}
