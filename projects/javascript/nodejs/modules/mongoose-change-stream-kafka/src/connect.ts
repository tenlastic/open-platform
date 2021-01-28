import { Admin, Kafka, Producer, logLevel } from 'kafkajs';

export let admin: Admin;
export let connection: Kafka;
export let producer: Producer;

export async function connect(connectionString: string) {
  const [credentials, brokers] = connectionString.split('@');
  const [username, password] = credentials.split(':').map(c => decodeURIComponent(c));

  connection = new Kafka({
    brokers: brokers.split(','),
    logLevel: logLevel.NOTHING,
    sasl: { mechanism: 'plain', password, username },
  });

  admin = connection.admin();
  producer = connection.producer();

  await admin.connect();
  await producer.connect();
}
