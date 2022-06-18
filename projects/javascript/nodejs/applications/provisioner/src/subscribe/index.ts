import { IDatabasePayload } from '@tenlastic/mongoose-models';
import nats from '@tenlastic/nats';
import * as mongoose from 'mongoose';
import { AckPolicy } from 'nats';
import { TextDecoder } from 'util';

/**
 * Copies NATS events to a separate queue.
 */
export async function subscribe<TDocument extends mongoose.Document>(
  Model: mongoose.Model<mongoose.Document>,
  queue: string,
  callback: (payload: IDatabasePayload<TDocument>) => Promise<void>,
) {
  const durable = `provisioner-${queue}`;
  const subject = `api.${Model.collection.name}`;

  const subscription = await nats.subscribe(durable, subject, {
    ack_policy: AckPolicy.Explicit,
    ack_wait: 60 * 1000 * 1000 * 1000,
    max_deliver: 5,
  });
  console.log(`Subscribed to ${subject} with group ${durable}.`);

  for await (const message of subscription) {
    const data = new TextDecoder().decode(message.data);
    const json = JSON.parse(data);

    try {
      await callback(json);
      message.ack();
    } catch (e) {
      console.error(e);
      message.nak(15 * 1000);
    }
  }
}
