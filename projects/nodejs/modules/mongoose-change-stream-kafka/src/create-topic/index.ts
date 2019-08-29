import { promisify } from 'util';

import { client } from '../connect';

export async function createTopic(topic: string) {
  const topics = [
    {
      topic,
      partitions: 3,
      replicationFactor: process.env.KAFKA_REPLICATION_FACTOR,
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
  ];

  try {
    const topicExistsAsync = promisify(client.topicExists).bind(client);
    await topicExistsAsync([topic]);
  } catch {
    const createTopicsAsync = promisify(client.createTopics).bind(client);
    await createTopicsAsync(topics);
  }

  const loadMetadataForTopicsAsync = promisify(client.loadMetadataForTopics).bind(client);
  await loadMetadataForTopicsAsync([topic]);

  const refreshMetadataAsync = promisify(client.refreshMetadata).bind(client);
  await refreshMetadataAsync([topic]);
}
