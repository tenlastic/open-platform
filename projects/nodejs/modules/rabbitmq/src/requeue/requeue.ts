import * as amqp from 'amqplib';

export interface RequeueOptions {
  delay?: number;
  retries?: number;
}

export async function requeue(
  channel: amqp.Channel,
  msg: amqp.ConsumeMessage,
  options: RequeueOptions = { delay: 0, retries: -1 },
) {
  options.delay = options.delay || 0;
  options.retries = options.retries >= 0 ? options.retries : -1;

  const queue = msg.properties.headers['x-original-queue'];
  const retries = msg.properties.headers['x-retries'] + 1;
  const headers = { 'x-original-queue': queue, 'x-retries': retries };

  // If the message has already been retried too many times, just ACK it.
  if (options.retries >= 0 && retries > options.retries) {
    channel.ack(msg);
    return;
  }

  const stringified = JSON.stringify(msg);
  const buffer = Buffer.from(stringified);

  // If the message should wait before being requeued, send it to a TTL queue.
  if (options.delay > 0) {
    const ttlQueue = `${queue}-ttl`;

    await channel.assertQueue(ttlQueue, { deadLetterExchange: queue, durable: true });
    channel.sendToQueue(ttlQueue, buffer, {
      expiration: options.delay,
      headers,
      persistent: true,
    });
  } else {
    await channel.assertExchange(queue, 'fanout');
    await channel.assertQueue(queue, { durable: true });
    await channel.bindQueue(queue, queue, '');

    channel.publish(queue, queue, buffer, { headers, persistent: true });
  }

  channel.ack(msg);
}
