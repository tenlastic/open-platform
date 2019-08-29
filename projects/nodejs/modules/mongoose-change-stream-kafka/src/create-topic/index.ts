import { admin } from '../connect';

export async function createTopic(topic: string) {
  const replicationFactor = process.env.KAFKA_REPLICATION_FACTOR;
  await admin.createTopics({
    topics: [
      {
        numPartitions: 3,
        replicationFactor: replicationFactor ? Number(replicationFactor) : 1,
        topic,
        configEntries: [
          {
            name: 'cleanup.policy',
            value: 'compact',
          },
          {
            name: 'compression.type',
            value: 'gzip',
          },
        ],
      },
    ],
  });
}
