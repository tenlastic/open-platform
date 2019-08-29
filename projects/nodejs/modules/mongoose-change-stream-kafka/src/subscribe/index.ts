import { IDatabasePayload } from '@tenlastic/mongoose-change-stream';
import { ConsumerGroup } from 'kafka-node';
import { Document, Model } from 'mongoose';

import { createTopic } from '../create-topic';

/**
 * Applies all change events from the topic to the target collection.
 */
export async function subscribe(Model: Model<Document>, group: string, topic: string) {
  await createTopic(topic);

  const consumerGroup = new ConsumerGroup(
    {
      fromOffset: 'earliest',
      groupId: group,
      kafkaHost: process.env.KAFKA_CONNECTION_STRING,
      protocol: ['roundrobin'],
    },
    topic,
  );

  consumerGroup.on('error', console.error);
  consumerGroup.on('message', async msg => {
    const value = msg.value as string;
    const json = JSON.parse(value) as IDatabasePayload<Model<Document>>;

    switch (json.operationType) {
      case 'delete':
        await Model.findOneAndDelete(json.documentKey);
        break;

      case 'insert':
        await Model.create(json.fullDocument);
        break;

      case 'update':
        const { removedFields, updatedFields } = json.updateDescription;
        const update: any = {};

        if (removedFields && removedFields.length > 0) {
          update.$unset = json.updateDescription.removedFields.reduce((agg: any, field: string) => {
            agg[field] = '';
            return agg;
          }, {});
        }

        if (updatedFields && Object.keys(updatedFields).length > 0) {
          update.$set = json.updateDescription.updatedFields;
        }

        if (update.$set || update.$unset) {
          await Model.findOneAndUpdate(json.documentKey, update);
        }

        break;
    }
  });
}
