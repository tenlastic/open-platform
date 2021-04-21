import * as kafka from '@tenlastic/kafka';
import { IDatabasePayload } from '@tenlastic/mongoose-change-stream';
import { Document } from 'mongoose';

/**
 * Publishes the payload to Kafka.
 */
export async function publish<T extends Document>(msg: IDatabasePayload<T>) {
  const { coll, db } = msg.ns;
  const topic = `${db}.${coll}`;

  await kafka.createTopic(topic);

  const key = JSON.stringify(msg.documentKey);
  const value = JSON.stringify(msg);

  const producer = kafka.getProducer();
  await producer.send({ topic, messages: [{ key, value }] });
}
