import { IDatabasePayload } from '@tenlastic/mongoose-models';
import * as nats from '@tenlastic/nats';
import { Document } from 'mongoose';

/**
 * Publishes the payload to NATS.
 */
export async function publish<T extends Document>(msg: IDatabasePayload<T>) {
  const { coll, db } = msg.ns;
  const subject = `${db}.${coll}`;

  return nats.publish(subject, msg);
}
