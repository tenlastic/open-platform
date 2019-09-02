import * as rabbitmq from '@tenlastic/rabbitmq';
import { Channel, ConsumeMessage } from 'amqplib';
import * as mongoose from 'mongoose';

import { Collection, Index, IndexDocument } from '../../models';

export const CREATE_COLLECTION_INDEX_QUEUE = 'create-collection-index';

export async function createCollectionIndexWorker(
  channel: Channel,
  content: Partial<IndexDocument>,
  msg: ConsumeMessage,
) {
  try {
    const index = new Index(content);

    // Create the index within MongoDB.
    await mongoose.connection.db.collection(index.collectionId.toString()).createIndex(index.key, {
      ...index.options,
      background: true,
      name: index.id,
    });

    // Save the index information to the Collection document.
    await Collection.findOneAndUpdate(
      {
        _id: index.collectionId,
        'indexes._id': { $ne: index._id },
      },
      {
        $addToSet: {
          indexes: index,
        },
      },
    );

    channel.ack(msg);
  } catch (e) {
    rabbitmq.requeue(channel, msg, { delay: 30 * 1000, retries: 3 });
  }
}
