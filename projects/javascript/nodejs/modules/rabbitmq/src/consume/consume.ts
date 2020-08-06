import * as amqp from 'amqplib';

import { connection, events } from '../connect';

let handler: () => void;

export async function consume(
  queue: string,
  onMessage: (channel: amqp.Channel, content: any, msg: amqp.ConsumeMessage) => void,
) {
  if (handler) {
    events.off('connect', handler);
  }

  const channel = await connection.createChannel();
  await channel.assertQueue(queue, { durable: true });

  await channel.prefetch(1);
  channel.consume(queue, msg => {
    const content = msg.content.toString('utf8');
    const parsed = JSON.parse(content);

    console.log('RabbitMQ message received:', parsed);

    onMessage(channel, parsed, msg);
  });

  handler = () => consume(queue, onMessage);
  events.on('connect', handler);

  console.log(`Subscribed to RabbitMQ queue: ${queue}.`);
}
