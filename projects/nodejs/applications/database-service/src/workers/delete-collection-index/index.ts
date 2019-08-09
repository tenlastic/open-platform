import { Channel, ConsumeMessage } from 'amqplib';
import * as mongoose from 'mongoose';

import { Collection } from '../../models';

export interface DeleteCollectionIndexMessage {
  collectionId: string;
  databaseId: string;
  indexId: string;
}

export async function deleteCollectionIndexWorker(
  channel: Channel,
  content: DeleteCollectionIndexMessage,
  msg: ConsumeMessage,
) {
  try {
    const { collectionId, indexId } = content;

    // Drop the index within MongoDB.
    const collection = collectionId.toString();
    await mongoose.connection.db.collection(collection).dropIndex(indexId);

    // Remove the index information from the Collection document.
    await Collection.findOneAndUpdate(
      { _id: collectionId },
      {
        $pull: {
          indexes: { _id: indexId },
        },
      },
    );

    channel.ack(msg);
  } catch (e) {
    channel.nack(msg);
  }
}
