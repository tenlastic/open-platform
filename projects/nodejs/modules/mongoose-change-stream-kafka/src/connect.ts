import { Admin, Kafka, Producer, logLevel } from 'kafkajs';

export let admin: Admin;
export let connection: Kafka;
export let producer: Producer;

export async function connect(brokers: string[]) {
  connection = new Kafka({ brokers, logLevel: logLevel.NOTHING });

  admin = connection.admin();
  producer = connection.producer();

  await admin.connect();
  await producer.connect();
}
