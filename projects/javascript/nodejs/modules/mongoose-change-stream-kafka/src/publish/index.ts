import { IDatabasePayload } from '@tenlastic/mongoose-change-stream';
import { Document } from 'mongoose';

import { producer } from '../connect';
import { createTopic } from '../create-topic';

/**
 * Publishes the payload to Kafka.
 */
export async function publish<T extends Document>(msg: IDatabasePayload<T>) {
  const { coll, db } = msg.ns;
  const topic = `${db}.${coll}`;

  await createTopic(topic);

  const key = JSON.stringify(msg.documentKey);
  const value = JSON.stringify(msg);

  await producer.send({ topic, messages: [{ key, value }] });
}
