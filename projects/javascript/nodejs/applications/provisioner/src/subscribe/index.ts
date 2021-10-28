import { IDatabasePayload } from '@tenlastic/mongoose-change-stream';
import nats from '@tenlastic/nats';
import * as rabbitmq from '@tenlastic/rabbitmq';
import * as mongoose from 'mongoose';
import { TextDecoder } from 'util';

/**
 * Copies NATS events to RabbitMQ.
 */
export async function subscribe<TDocument extends mongoose.Document>(
  Model: mongoose.Model<mongoose.Document>,
  queue: string,
  callback: (payload: IDatabasePayload<TDocument>) => Promise<void>,
) {
  return Promise.all([subscribeToNats(Model, queue), subscribeToRabbitMQ(queue, callback)]);
}

/**
 * Copies NATS messages to RabbitMQ.
 */
async function subscribeToNats(Model: mongoose.Model<mongoose.Document>, queue: string) {
  const subject = `api.${Model.collection.name}`;

  const subscription = await nats.subscribe(`provisioner-${queue}`, subject);
  for await (const message of subscription) {
    const data = new TextDecoder().decode(message.data);
    const json = JSON.parse(data);

    rabbitmq.publish(`provisioner.${queue}`, json);
  }
}

/**
 * Subscribes to RabbitMQ and executes the callback with returned messages.
 */
function subscribeToRabbitMQ<TDocument extends mongoose.Document>(
  queue: string,
  callback: (payload: IDatabasePayload<TDocument>) => Promise<void>,
) {
  return rabbitmq.consume(`provisioner.${queue}`, async (channel, content, msg) => {
    try {
      await callback(content);
    } catch (e) {
      console.error(e);
      await rabbitmq.requeue(channel, msg, { delay: 15 * 1000, retries: 3 });
    } finally {
      channel.ack(msg);
    }
  });
}
