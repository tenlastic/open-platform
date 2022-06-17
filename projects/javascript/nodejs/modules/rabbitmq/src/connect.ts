import * as amqp from 'amqplib';
import { EventEmitter } from 'events';

export interface ConnectionOptions {
  url: string;
}

export let connection: amqp.Connection;
export const events = new EventEmitter();

export async function connect(options: ConnectionOptions) {
  try {
    connection = await amqp.connect(options.url, { heartbeat: 60 });
  } catch (err) {
    console.error(`Could not connect to RabbitMQ: ${err.message}.`);

    await new Promise((res) => setTimeout(res, 5000));
    return connect(options);
  }

  connection.on('close', () => {
    console.error('RabbitMQ connection closed.');
    setTimeout(() => connect(options), 5000);
  });

  connection.on('error', console.error);

  events.emit('connect');
  console.log('Connected to RabbitMQ.');
}
