import * as nats from '@tenlastic/nats';
import * as mongoose from 'mongoose';
import { AckPolicy, ConsumerConfig } from 'nats';
import { TextDecoder } from 'util';

import { DatabasePayload } from './database-payload';
import { EventEmitter } from './event-emitter';

/**
 * Applies all change events from the topic to the target collection.
 */
export async function emit<TDocument extends mongoose.Document>(
  database: string,
  durable: string,
  Event: EventEmitter<DatabasePayload<TDocument>>,
  Model: mongoose.Model<mongoose.Document>,
  options?: Partial<ConsumerConfig>,
) {
  const collection = Model.collection.name;
  const subject = `${database}.${collection}`;

  const subscription = await nats.subscribe(subject, {
    ack_policy: AckPolicy.Explicit,
    ack_wait: 60 * 1000 * 1000 * 1000,
    durable_name: `${durable}-${collection}`,
    inactive_threshold: 7 * 24 * 60 * 60 * 1000 * 1000 * 1000,
    max_deliver: 5,
    ...options,
  });

  for await (const message of subscription) {
    const data = new TextDecoder().decode(message.data);
    const json = JSON.parse(data);
    json.fullDocument = new Model(json.fullDocument);

    try {
      await Event.emit(json);
      message.ack();
    } catch (e) {
      console.error(e);
      message.nak();
    }
  }
}
