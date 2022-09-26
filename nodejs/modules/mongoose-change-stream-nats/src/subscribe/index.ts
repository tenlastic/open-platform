import { IDatabasePayload } from '@tenlastic/mongoose-models';
import nats from '@tenlastic/nats';
import * as mongoose from 'mongoose';
import { AckPolicy } from 'nats';
import { TextDecoder } from 'util';

/**
 * Applies all change events from the topic to the target collection.
 */
export async function subscribe<TDocument extends mongoose.Document = any>(
  durable: string,
  Model: mongoose.Model<mongoose.Document>,
  callback: (payload: IDatabasePayload<TDocument>) => Promise<void>,
) {
  const coll = Model.collection.name;
  const db = Model.db.db.databaseName;
  const subject = `${db}.${coll}`;

  const subscription = await nats.subscribe(`${durable}-${coll}`, subject, {
    ack_policy: AckPolicy.Explicit,
    ack_wait: 60 * 1000 * 1000 * 1000,
    max_deliver: 5,
  });
  console.log(`Subscribed to ${subject} with group ${durable}-${coll}.`);

  for await (const message of subscription) {
    const data = new TextDecoder().decode(message.data);
    const json = JSON.parse(data);

    if (json.fullDocument) {
      json.fullDocument = new Model(json.fullDocument);
    }

    try {
      await callback(json);
      message.ack();
    } catch (e) {
      console.error(e);
      message.nak();
    }
  }
}
