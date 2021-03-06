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
    retry: {
      factor: 0,
      initialRetryTime: 1000,
      maxRetryTime: 15000,
      multiplier: 2,
      retries: 25,
    },
  };
  if (credentials) {
    const [username, password] = credentials.split(':').map(c => decodeURIComponent(c));
    config.sasl = { mechanism: 'plain', password, username };
  }

  connection = new Kafka(config);
  admin = connection.admin();
  producer = connection.producer({ allowAutoTopicCreation: false });

  await admin.connect();
  await producer.connect();

  return connection;
}

export function getAdmin() {
  return admin;
}

export function getConnection() {
  return connection;
}

export function getProducer() {
  return producer;
}
