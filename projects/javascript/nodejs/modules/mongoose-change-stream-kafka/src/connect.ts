import { Admin, Kafka, KafkaConfig, Producer, logLevel } from 'kafkajs';

export let admin: Admin;
export let connection: Kafka;
export let producer: Producer;

export async function connect(connectionString: string) {
  const [credentials, brokers] = connectionString.includes('@')
    ? connectionString.split('@')
    : [null, connectionString];

  const config: KafkaConfig = {
    brokers: brokers.split(','),
    logLevel: logLevel.NOTHING,
  };
  if (credentials) {
    const [username, password] = credentials.split(':').map(c => decodeURIComponent(c));
    config.sasl = { mechanism: 'plain', password, username };
  }

  connection = new Kafka(config);
  admin = connection.admin();
  producer = connection.producer();

  await admin.connect();
  await producer.connect();
}
