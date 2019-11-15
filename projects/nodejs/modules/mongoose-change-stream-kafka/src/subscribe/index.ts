import { IDatabasePayload } from '@tenlastic/mongoose-change-stream';
import * as mongoose from 'mongoose';

import { connection } from '../connect';
import { createTopic } from '../create-topic';

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
  await createTopic(options.topic);

  const consumer = connection.consumer({ groupId: `${options.group}-${options.topic}` });
  await consumer.connect();

  await consumer.subscribe({ fromBeginning: true, topic: options.topic });
  await consumer.run({
    eachMessage: async data => {
      const value = data.message.value.toString();
      const json = JSON.parse(value) as IDatabasePayload<mongoose.Model<mongoose.Document>>;

      try {
        switch (json.operationType) {
          case 'delete':
            await Model.findOneAndDelete(json.documentKey);
            break;

          case 'insert':
            await Model.create(json.fullDocument);
            break;

          case 'update':
            if (options.useUpdateDescription) {
              const { removedFields, updatedFields } = json.updateDescription;
              const update: any = {};

              if (removedFields && removedFields.length > 0) {
                update.$unset = json.updateDescription.removedFields.reduce(
                  (agg: any, field: string) => {
                    agg[field] = '';
                    return agg;
                  },
                  {},
                );
              }

              if (updatedFields && Object.keys(updatedFields).length > 0) {
                update.$set = json.updateDescription.updatedFields;
              }

              if (update.$set || update.$unset) {
                await Model.findOneAndUpdate(json.documentKey, update, { upsert: true });
              }
            } else {
              await Model.findOneAndUpdate(json.documentKey, json.fullDocument, { upsert: true });
            }

            break;
        }
      } catch (e) {
        console.error(e);
      }
    },
  });
}
