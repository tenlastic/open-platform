import * as rabbitmq from '@tenlastic/rabbitmq';
import { Channel, ConsumeMessage } from 'amqplib';

import { RABBITMQ_PREFIX } from '../../constants';
import { Collection, Index, IndexDocument } from '@tenlastic/mongoose-models';

export const CREATE_COLLECTION_INDEX_QUEUE = `${RABBITMQ_PREFIX}.create-collection-index`;

export async function createCollectionIndexWorker(
  channel: Channel,
  content: Partial<IndexDocument>,
  msg: ConsumeMessage,
) {
  try {
    const index = Index.hydrate(content);
    await index.createMongoIndex();

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
