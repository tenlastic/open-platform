import * as mongooseModels from '@tenlastic/mongoose-models';
import * as nats from '@tenlastic/nats';
import * as mongoose from 'mongoose';
import { AckPolicy, DeliverPolicy } from 'nats';
import { TextDecoder } from 'util';
import { parse } from '../parse';

export interface ReplicateOptions {
  durable: string;
  start?: Date;
  subject: string;
  useUpdateDescription?: boolean;
}

/**
 * Applies all change events from the topic to the target collection.
 */
export async function replicateFromNats(
  collectionName: string,
  connection: mongoose.Connection,
  options: ReplicateOptions,
) {
  const collection = connection.collection(collectionName);

  const subscription = await nats.subscribe(options.durable, options.subject, {
    ack_policy: AckPolicy.Explicit,
    ack_wait: 60 * 1000 * 1000 * 1000,
    deliver_policy: DeliverPolicy.StartTime,
    inactive_threshold: 30 * 24 * 60 * 60 * 1000 * 1000 * 1000,
    max_deliver: 5,
    opt_start_time: options.start?.toISOString(),
  });

  for await (const message of subscription) {
    const data = new TextDecoder().decode(message.data);
    const json = JSON.parse(data);

    try {
      await eachMessage(collection, options, json);
      message.ack();
    } catch (e) {
      console.error(e);
      message.nak();

      process.exit(1);
    }
  }
}

export async function eachMessage(
  collection: mongoose.Collection,
  options: ReplicateOptions,
  payload: mongooseModels.IDatabasePayload<mongoose.Model<mongoose.Document>>,
) {
  const documentKey = parse(payload.documentKey);
  const fullDocument = parse(payload.fullDocument);
  const { operationType, updateDescription } = payload;

  // Remove _id from fullDocument for update operations.
  if (fullDocument) {
    delete fullDocument._id;
  }

  if (operationType === 'delete') {
    await collection.deleteOne(documentKey);
  } else if (operationType === 'insert') {
    await collection.replaceOne(documentKey, fullDocument, { upsert: true });
  } else if (options.useUpdateDescription) {
    const { removedFields, updatedFields } = updateDescription;
    const update: any = {};

    if (removedFields && removedFields.length > 0) {
      update.$unset = updateDescription.removedFields.reduce((agg: any, field: string) => {
        agg[field] = '';
        return agg;
      }, {});
    }

    if (updatedFields && Object.keys(updatedFields).length > 0) {
      update.$set = parse(updateDescription.updatedFields);
    }

    if (update.$set || update.$unset) {
      await collection.updateOne(documentKey, update, { upsert: true });
    }
  } else {
    await collection.replaceOne(documentKey, fullDocument, { upsert: true });
  }
}
