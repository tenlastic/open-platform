import { QueueModel, QueueMemberModel } from '@tenlastic/http';
import * as redis from '@tenlastic/redis';
import { Redis } from 'ioredis';

import dependencies from '../dependencies';

const podName = process.env.POD_NAME;
const redisConnectionString = process.env.REDIS_CONNECTION_STRING;
const redisPassword = process.env.REDIS_PASSWORD;

export function remove(client: Redis, queueMember: QueueMemberModel) {
  const score = getScore(queueMember._id);
  return client.zremrangebyscore(podName, score, score);
}

export async function start(queue: QueueModel) {
  // Connect to Sentinel.
  const client = await redis.connect({
    connectionString: redisConnectionString,
    name: 'mymaster',
    password: redisPassword,
  });
  console.log('Connected to Redis.');

  // Deterministically get keys that do not have a replica.
  const keys = await client.keys('*');
  const results = keys
    .filter((k) => {
      const index = podName.replace(`queue-${queue._id}-`, '');
      const key = k.replace(`queue-${queue._id}-`, '');
      return Number(key) % queue.replicas === Number(index);
    })
    .filter((k) => k !== podName);

  // Merge orphan keys.
  console.log(`Merging ${results.length} orphans...`);
  if (results.length) {
    await client.zunionstore(`${podName}-union`, results.length, ...results);
    await client.rename(`${podName}-union`, podName);
    await client.del(...results);
  }

  // Fetch existing QueueMembers from Redis.
  const queueMembers = await client.zrange(podName, 0, -1);
  console.log(`Retrieved ${queueMembers.length} existing QueueMembers.`);

  // Add existing QueueMembers to the store.
  for (const queueMember of queueMembers) {
    const json = JSON.parse(queueMember);
    dependencies.queueMemberStore.upsertMany([new QueueMemberModel(json)]);
  }

  return client;
}

export async function upsert(client: Redis, queueMember: QueueMemberModel) {
  const score = getScore(queueMember._id);
  return client.zadd(podName, score, JSON.stringify(queueMember));
}

function getScore(_id: string) {
  return Number(`0x${_id}`);
}
