import * as amqp from 'amqplib';
import { EventEmitter } from 'events';

export interface ConnectionOptions {
  url: string;
}

export let connection: amqp.Connection;
export let events = new EventEmitter();

export async function connect(options: ConnectionOptions) {
  try {
    connection = await amqp.connect(options.url, { heartbeat: 60 });
  } catch (err) {
    console.error(err);
    setTimeout(() => connect(options), 1000);

    return;
  }

  connection.on('close', () => {
    console.error('RabbitMQ connection closed.');
    setTimeout(() => connect(options), 1000);
  });

  connection.on('error', err => {
    console.error(err);
    setTimeout(() => connect(options), 1000);
  });

  events.emit('connect');
  console.log('Connected to RabbitMQ.');
}
