import * as rabbitmq from '@tenlastic/rabbitmq';
import { Channel, ConsumeMessage } from 'amqplib';
import * as mongoose from 'mongoose';

import { Collection, Index, IndexDocument } from '../../models';

export const DELETE_COLLECTION_INDEX_QUEUE = 'delete-collection-index';

export async function deleteCollectionIndexWorker(
  channel: Channel,
  content: Partial<IndexDocument>,
  msg: ConsumeMessage,
) {
  try {
    const index = new Index(content);

    // Drop the index within MongoDB.
    await mongoose.connection.db.collection(index.collectionId.toString()).dropIndex(index.id);

    // Remove the index information from the Collection document.
    await Collection.findOneAndUpdate(
      { _id: index.collectionId },
      {
        $pull: {
          indexes: { _id: index._id },
        },
      },
    );

    channel.ack(msg);
  } catch (e) {
    rabbitmq.requeue(channel, msg, { delay: 30 * 1000 });
  }
}
