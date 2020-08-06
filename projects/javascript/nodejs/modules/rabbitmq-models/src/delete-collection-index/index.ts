import * as rabbitmq from '@tenlastic/rabbitmq';
import { Channel, ConsumeMessage } from 'amqplib';

import { Collection, Index, IndexDocument } from '@tenlastic/mongoose-models';

const QUEUE = `${process.env.RABBITMQ_PREFIX}.delete-collection-index`;

async function onMessage(channel: Channel, content: Partial<IndexDocument>, msg: ConsumeMessage) {
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

async function publish(index: IndexDocument) {
  return rabbitmq.publish(QUEUE, index);
}

function purge() {
  return rabbitmq.purge(QUEUE);
}

function subscribe() {
  return rabbitmq.consume(QUEUE, onMessage);
}

export const DeleteCollectionIndex = {
  onMessage,
  publish,
  purge,
  subscribe,
};
