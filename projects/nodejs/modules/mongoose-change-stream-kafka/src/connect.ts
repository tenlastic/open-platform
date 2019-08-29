import { Admin, Kafka, Producer, logLevel } from 'kafkajs';

export let admin: Admin;
export let connection: Kafka;
export let producer: Producer;

export async function connect(brokers: string[]) {
  connection = new Kafka({ brokers, logLevel: logLevel.NOTHING });

  admin = connection.admin();
  await admin.connect();

  producer = connection.producer();
  await producer.connect();
}
