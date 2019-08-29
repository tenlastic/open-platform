import { IDatabasePayload } from '@tenlastic/mongoose-change-stream';
import { KeyedMessage, Producer } from 'kafka-node';
import { Document } from 'mongoose';
import { promisify } from 'util';

import { client } from '../connect';
import { createTopic } from '../create-topic';

/**
 * Publishes the payload to Kafka.
 */
export async function publish<T extends Document>(msg: IDatabasePayload<T>) {
  const { coll, db } = msg.ns;
  const topic = `${db}.${coll}`;

  await createTopic(topic);

  const producer = new Producer(client, { partitionerType: 3 });
  producer.on('error', console.error);

  const key = JSON.stringify(msg.documentKey);
  const value = JSON.stringify(msg);
  const keyedMessage = new KeyedMessage(key, value);

  const sendAsync = promisify(producer.send).bind(producer);
  await sendAsync([{ topic, messages: [keyedMessage] }]);
}
