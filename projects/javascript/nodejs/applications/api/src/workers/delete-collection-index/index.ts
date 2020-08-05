import * as rabbitmq from '@tenlastic/rabbitmq';
import { Channel, ConsumeMessage } from 'amqplib';

import { RABBITMQ_PREFIX } from '../../constants';
import { Collection, Index, IndexDocument } from '@tenlastic/mongoose-models';

export const DELETE_COLLECTION_INDEX_QUEUE = `${RABBITMQ_PREFIX}.delete-collection-index`;

export async function deleteCollectionIndexWorker(
  channel: Channel,
  content: Partial<IndexDocument>,
  msg: ConsumeMessage,
) {
  try {
    const index = Index.hydrate(content);
    await index.deleteMongoIndex();

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
    rabbitmq.requeue(channel, msg, { delay: 30 * 1000, retries: 3 });
  }
}
