import * as kafka from '@tenlastic/kafka';
import { IDatabasePayload } from '@tenlastic/mongoose-change-stream';
import * as rabbitmq from '@tenlastic/rabbitmq';
import * as mongoose from 'mongoose';

/**
 * Copies Kafka events to RabbitMQ.
 */
export async function subscribe<TDocument extends mongoose.Document>(
  Model: mongoose.Model<mongoose.Document>,
  queue: string,
  callback: (payload: IDatabasePayload<TDocument>) => Promise<void>,
) {
  const topic = `api.${Model.collection.name}`;

  await kafka.createTopic(topic);

  const connection = kafka.getConnection();
  const consumer = connection.consumer({ groupId: `provisioner-${queue}` });
  await consumer.connect();

  await consumer.subscribe({ topic });
  await consumer.run({
    eachMessage: data => {
      const payload = data.message.value.toString();
      return rabbitmq.publish(`provisioner.${queue}`, payload);
    },
  });

  rabbitmq.consume(`provisioner.${queue}`, async (channel, content, msg) => {
    try {
      console.log(`Message from provisioner.${queue}.`);
      await callback(content);
    } catch (e) {
      console.log(`Error processing message from provisioner.${queue}.`);
      console.error(e);
      await rabbitmq.requeue(channel, msg, { delay: 15 * 1000 });
    } finally {
      console.log(`Acking message from provisioner.${queue}.`);
      channel.ack(msg);
    }
  });
}
