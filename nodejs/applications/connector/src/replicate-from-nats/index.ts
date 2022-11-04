import * as mongooseModels from '@tenlastic/mongoose-models';
import * as mongoosePermissions from '@tenlastic/mongoose-permissions';
import * as nats from '@tenlastic/nats';
import * as mongoose from 'mongoose';
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
  Model: mongoose.Model<mongoose.Document>,
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
      await eachMessage(Model, options, json, new mongoose.Query().cast(Model, where));
      message.ack();
    } catch (e) {
      console.error(e);
      message.nak();

      process.exit(1);
    }
  }
}

export async function eachMessage(
  Model: mongoose.Model<mongoose.Document>,
  options: ReplicateOptions,
  payload: mongooseModels.IDatabasePayload<mongoose.Model<mongoose.Document>>,
  where?: any,
) {
  if (where) {
    const fullDocument = new mongoose.Query().cast(Model, payload.fullDocument);

    if (!mongoosePermissions.isJsonValid(fullDocument, where)) {
      return;
    }
  }

  const { documentKey, operationType, updateDescription } = payload;
  if (operationType === 'delete') {
    await Model.deleteOne(documentKey);
  } else if (operationType === 'insert') {
    await Model.create(payload.fullDocument);
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
      await Model.updateOne(documentKey, update, { upsert: true });
    }
  } else if (operationType === 'replace') {
    await Model.replaceOne(documentKey, payload.fullDocument, { upsert: true });
  } else if (operationType === 'update') {
    await Model.updateOne(documentKey, payload.fullDocument, { upsert: true });
  }
}
