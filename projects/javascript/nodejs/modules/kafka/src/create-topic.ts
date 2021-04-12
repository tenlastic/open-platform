import { admin } from './connect';

export async function createTopic(topic: string) {
  const replicationFactor = process.env.KAFKA_REPLICATION_FACTOR;

  return admin.createTopics({
    topics: [
      {
        configEntries: [
          { name: 'cleanup.policy', value: 'compact' },
          { name: 'compression.type', value: 'gzip' },
        ],
        numPartitions: 3,
        replicationFactor: replicationFactor ? Number(replicationFactor) : 1,
        topic,
      },
    ],
  });
}
