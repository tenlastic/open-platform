import * as mongooseModels from '@tenlastic/mongoose-models';
import * as mongoosePermissions from '@tenlastic/mongoose-permissions';
import * as nats from '@tenlastic/nats';
import * as mongoose from 'mongoose';
import { AckPolicy } from 'nats';
import { TextDecoder } from 'util';

export interface ReplicateOptions {
  durable: string;
  subject: string;
  useUpdateDescription?: boolean;
}

/**
 * Applies all change events from the topic to the target collection.
 */
export async function replicateFromNats(
  collectionName: string,
  connectionString: string,
  databaseName: string,
  options: ReplicateOptions,
  where: any,
) {
  const connection = await mongooseModels.createConnection({ connectionString, databaseName });
  const collection = connection.collection(collectionName);

  const subscription = await nats.subscribe(options.durable, options.subject, {
    ack_policy: AckPolicy.Explicit,
    ack_wait: 60 * 1000 * 1000 * 1000,
    max_deliver: 5,
  });

  for await (const message of subscription) {
    const data = new TextDecoder().decode(message.data);
    const json = JSON.parse(data);

    await eachMessage(collection, options, json, where);
  }
}

export async function eachMessage(
  collection: mongoose.Collection,
  options: ReplicateOptions,
  payload: mongooseModels.IDatabasePayload<mongoose.Model<mongoose.Document>>,
  where: any,
) {
  try {
    const { documentKey, fullDocument, operationType, updateDescription } = payload;

    if (!mongoosePermissions.isJsonValid(fullDocument, where)) {
      return;
    }

    if (operationType === 'delete') {
      await collection.deleteOne(documentKey);
    } else if (operationType === 'insert') {
      await collection.insertOne(fullDocument);
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
        update.$set = updateDescription.updatedFields;
      }

      if (update.$set || update.$unset) {
        await collection.updateOne(documentKey, update, { upsert: true });
      }
    } else {
      await collection.replaceOne(documentKey, fullDocument, { upsert: true });
    }
  } catch (e) {
    console.error(e);
  }
}
