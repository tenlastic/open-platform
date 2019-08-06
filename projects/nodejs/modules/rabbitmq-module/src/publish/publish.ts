import { connection } from '../connect';

export async function publish(queue: string, msg: any) {
  const channel = await connection.createChannel();
  await channel.assertQueue(queue, { durable: true });

  const stringified = JSON.stringify(msg);
  channel.sendToQueue(queue, Buffer.from(stringified), { persistent: true });

  channel.close();
}
