import { IDatabasePayload } from '@tenlastic/mongoose';
import * as nats from '@tenlastic/nats';
import * as mongoose from 'mongoose';
import { AckPolicy } from 'nats';
import { TextDecoder } from 'util';

/**
 * Applies all change events from the topic to the target collection.
 */
export async function subscribe<TDocument extends mongoose.Document = any>(
  database: string,
  durable: string,
  Model: mongoose.Model<mongoose.Document>,
  callback: (payload: IDatabasePayload<TDocument>) => Promise<void>,
) {
  const collection = Model.collection.name;
  const subject = `${database}.${collection}`;

  const subscription = await nats.subscribe(subject, {
    ack_policy: AckPolicy.Explicit,
    ack_wait: 60 * 1000 * 1000 * 1000,
    durable_name: `${durable}-${collection}`,
    inactive_threshold: 7 * 24 * 60 * 60 * 1000 * 1000 * 1000,
    max_deliver: 5,
  });
  console.log(`Subscribed to ${subject} with group ${durable}-${collection}.`);

  for await (const message of subscription) {
    const data = new TextDecoder().decode(message.data);
    const json = JSON.parse(data);
    json.fullDocument = new Model(json.fullDocument);

    try {
      await callback(json);
      message.ack();
    } catch (e) {
      console.error(e);
      message.nak();
    }
  }
}
