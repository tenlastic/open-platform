import * as amqp from 'amqplib';

import { connection, events } from '../connect';

export async function consume(
  queue: string,
  onMessage: (channel: amqp.Channel, content: any, msg: amqp.ConsumeMessage) => void,
) {
  const channel = await connection.createChannel();
  await channel.assertQueue(queue, { durable: true });

  await channel.prefetch(1);
  channel.consume(queue, msg => {
    const content = msg.content.toString('utf8');
    const parsed = JSON.parse(content);

    onMessage(channel, parsed, msg);
  });

  // Resubscibe on reconnect.
  events.once('connect', () => consume(queue, onMessage));
  console.log(`Subscribed to RabbitMQ queue: ${queue}.`);
}
