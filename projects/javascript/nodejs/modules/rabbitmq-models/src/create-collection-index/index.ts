import { Collection, Index, IndexDocument } from '@tenlastic/mongoose-models';
import * as rabbitmq from '@tenlastic/rabbitmq';
import { Channel, ConsumeMessage } from 'amqplib';

const QUEUE = `${process.env.RABBITMQ_PREFIX}.create-collection-index`;

async function onMessage(channel: Channel, content: Partial<IndexDocument>, msg: ConsumeMessage) {
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

async function publish(index: IndexDocument) {
  return rabbitmq.publish(QUEUE, index);
}

function purge() {
  return rabbitmq.purge(QUEUE);
}

function subscribe() {
  return rabbitmq.consume(QUEUE, onMessage);
}

export const CreateCollectionIndex = {
  onMessage,
  publish,
  purge,
  subscribe,
};
