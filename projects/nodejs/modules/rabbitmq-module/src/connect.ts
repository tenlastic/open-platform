import * as amqp from 'amqplib';

export interface ConnectionOptions {
  url: string;
}

export let connection: amqp.Connection;

export async function connect(options: ConnectionOptions) {
  try {
    connection = await amqp.connect(options.url, { heartbeat: 60 });
  } catch (err) {
    console.error(err);

    if (err.message !== 'Connection closing') {
      setTimeout(() => connect(options), 1000);
    }

    return;
  }

  connection.on('close', () => {
    setTimeout(() => connect(options), 1000);
  });

  connection.on('error', err => {
    console.error(err);

    if (err.message !== 'Connection closing') {
      setTimeout(() => connect(options), 1000);
    }
  });
}
