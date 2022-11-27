import * as mongoose from '@tenlastic/mongoose';
import * as mongoosePermissions from '@tenlastic/mongoose-permissions';
import * as nats from '@tenlastic/nats';
import { Document, Model, Query } from 'mongoose';
import { AckPolicy, DeliverPolicy } from 'nats';
import { TextDecoder } from 'util';

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
  model: Model<Document>,
  options: ReplicateOptions,
  where?: any,
) {
  const subscription = await nats.subscribe(options.subject, {
    ack_policy: AckPolicy.Explicit,
    ack_wait: 60 * 1000 * 1000 * 1000,
    deliver_policy: DeliverPolicy.StartTime,
    durable_name: options.durable,
    inactive_threshold: 30 * 24 * 60 * 60 * 1000 * 1000 * 1000,
    max_deliver: 5,
    opt_start_time: options.start?.toISOString(),
  });

  for await (const message of subscription) {
    const data = new TextDecoder().decode(message.data);
    const json = JSON.parse(data);

    try {
      await eachMessage(model, options, json, new Query().cast(model, where));
      message.ack();
    } catch (e) {
      console.error(e);
      message.nak();

      process.exit(1);
    }
  }
}

export async function eachMessage(
  model: Model<Document>,
  options: ReplicateOptions,
  payload: mongoose.IDatabasePayload<Model<Document>>,
  where?: any,
) {
  if (where) {
    const fullDocument = new Query().cast(model, payload.fullDocument);

    if (!mongoosePermissions.isJsonValid(fullDocument, where)) {
      return;
    }
  }

  const { documentKey, operationType, updateDescription } = payload;
  if (operationType === 'delete') {
    await model.deleteOne(documentKey);
  } else if (operationType === 'insert') {
    await model.create(payload.fullDocument);
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
      await model.updateOne(documentKey, update, { upsert: true });
    }
  } else if (operationType === 'replace') {
    await model.replaceOne(documentKey, payload.fullDocument, { upsert: true });
  } else if (operationType === 'update') {
    await model.updateOne(documentKey, payload.fullDocument, { upsert: true });
  }
}
