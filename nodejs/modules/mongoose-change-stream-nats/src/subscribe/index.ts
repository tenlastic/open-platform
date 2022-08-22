import nats from '@tenlastic/nats';
import { EventEmitter, IDatabasePayload } from '@tenlastic/mongoose-models';
import * as mongoose from 'mongoose';
import { AckPolicy } from 'nats';
import { TextDecoder } from 'util';

/**
 * Applies all change events from the topic to the target collection.
 */
export async function subscribe(
  durable: string,
  eventEmitter: EventEmitter<IDatabasePayload<mongoose.Document>>,
  Model: mongoose.Model<mongoose.Document>,
) {
  const coll = Model.collection.name;
  const db = Model.db.db.databaseName;
  const subject = `${db}.${coll}`;

  const subscription = await nats.subscribe(`${durable}-${coll}`, subject, {
    ack_policy: AckPolicy.Explicit,
    ack_wait: 5 * 60 * 1000 * 1000 * 1000,
    max_deliver: 5,
  });

  for await (const message of subscription) {
    const data = new TextDecoder().decode(message.data);

    const json = JSON.parse(data);
    json.fullDocument = Model.hydrate(json.fullDocument);

    try {
      await eventEmitter.emit(json);
      message.ack();
    } catch (e) {
      console.error(e);
      message.nak(15 * 1000);
    }
  }
}
