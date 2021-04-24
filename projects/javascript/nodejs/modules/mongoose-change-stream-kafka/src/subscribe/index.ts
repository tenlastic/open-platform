import * as kafka from '@tenlastic/kafka';
import { IDatabasePayload } from '@tenlastic/mongoose-change-stream';
import * as mongoose from 'mongoose';

export interface SubscribeOptions {
  group: string;
  topic: string;
  useUpdateDescription?: boolean;
}

/**
 * Applies all change events from the topic to the target collection.
 */
export async function subscribe(
  Model: mongoose.Model<mongoose.Document>,
  options: SubscribeOptions,
) {
  await kafka.createTopic(options.topic);

  const connection = kafka.getConnection();
  const consumer = connection.consumer({ groupId: `${options.group}-${options.topic}` });
  await consumer.connect();

  await consumer.subscribe({ fromBeginning: true, topic: options.topic });
  await consumer.run({
    eachMessage: data => {
      const value = data.message.value.toString();
      return eachMessage(Model, options, JSON.parse(value));
    },
  });
}

export async function eachMessage(
  Model: mongoose.Model<mongoose.Document>,
  options: SubscribeOptions,
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
