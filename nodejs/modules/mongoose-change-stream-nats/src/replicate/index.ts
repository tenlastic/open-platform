import nats from '@tenlastic/nats';
import { IDatabasePayload } from '@tenlastic/mongoose-models';
import * as mongoose from 'mongoose';
import { TextDecoder } from 'util';

export interface ReplicateOptions {
  durable: string;
  subject: string;
  useUpdateDescription?: boolean;
}

/**
 * Applies all change events from the topic to the target collection.
 */
export async function replicate(
  Model: mongoose.Model<mongoose.Document>,
  options: ReplicateOptions,
) {
  const subscription = await nats.subscribe(options.durable, options.subject);

  for await (const message of subscription) {
    const data = new TextDecoder().decode(message.data);
    const json = JSON.parse(data);

    await eachMessage(Model, options, json);
  }
}

export async function eachMessage(
  Model: mongoose.Model<mongoose.Document>,
  options: ReplicateOptions,
  payload: IDatabasePayload<mongoose.Model<mongoose.Document>>,
) {
  try {
    if (payload.operationType === 'delete') {
      await Model.findOneAndDelete(payload.documentKey);
    } else if (payload.operationType === 'insert') {
      await Model.create(payload.fullDocument);
    } else if (options.useUpdateDescription) {
      const { removedFields, updatedFields } = payload.updateDescription;
      const update: any = {};

      if (removedFields && removedFields.length > 0) {
        update.$unset = payload.updateDescription.removedFields.reduce(
          (agg: any, field: string) => {
            agg[field] = '';
            return agg;
          },
          {},
        );
      }

      if (updatedFields && Object.keys(updatedFields).length > 0) {
        update.$set = payload.updateDescription.updatedFields;
      }

      if (update.$set || update.$unset) {
        await Model.findOneAndUpdate(payload.documentKey, update, { upsert: true });
      }
    } else {
      await Model.findOneAndUpdate(payload.documentKey, payload.fullDocument, { upsert: true });
    }
  } catch (e) {
    console.error(e);
  }
}
