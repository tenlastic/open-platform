import { Channel, ConsumeMessage } from 'amqplib';
import * as mongoose from 'mongoose';

import { Collection, IndexKey, IndexOptions } from '../../models';

export interface CreateCollectionIndexMessage {
  collectionId: string;
  databaseId: string;
  indexId: string;
  key: IndexKey;
  options: IndexOptions;
}

export async function createCollectionIndexWorker(
  channel: Channel,
  content: CreateCollectionIndexMessage,
  msg: ConsumeMessage,
) {
  try {
    const { collectionId, indexId, key, options } = content;

    // Create the index within MongoDB.
    const collection = collectionId.toString();
    options.name = indexId;
    await mongoose.connection.db.collection(collection).createIndex(key, options);

    // Save the index information to the Collection document.
    await Collection.findOneAndUpdate(
      {
        _id: collectionId,
        'indexes._id': { $ne: indexId },
      },
      {
        $push: {
          indexes: { _id: indexId, key, options },
        },
      },
    );

    channel.ack(msg);
  } catch (e) {
    channel.nack(msg);
  }
}
