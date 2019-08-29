import { KafkaClient } from 'kafka-node';

export let client: KafkaClient;

export async function connect(url: string) {
  if (client) {
    return client;
  }

  client = new KafkaClient({ kafkaHost: url });
  return client;
}
