import * as Redis from 'ioredis';

import dependencies from '../dependencies';

const podName = process.env.POD_NAME;
const queue = JSON.parse(process.env.QUEUE_JSON);
const redisSentinelPassword = process.env.REDIS_SENTINEL_PASSWORD;
const sentinels = process.env.SENTINELS.split(',');

export async function start() {
  // Connect to Sentinel.
  const client = new Redis({
    name: 'mymaster',
    password: redisSentinelPassword,
    retryStrategy: (times) => Math.min(times * 1000, 5000),
    sentinelPassword: redisSentinelPassword,
    sentinels: sentinels.map((s) => {
      const [host, port] = s.split(':');
      return { host, port: Number(port) };
    }),
  });
  client.on('connect', () => console.log('Connected to Redis.'));
  client.on('error', (err) => console.error(err.message));

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
    dependencies.queueMemberStore.upsert(json._id, json);
  }

  // Sync QueueMembers with Redis.
  dependencies.queueMemberService.emitter.on('create', (qm) =>
    client.zadd(podName, getScore(qm._id), JSON.stringify(qm)),
  );
  dependencies.queueMemberService.emitter.on('delete', (qm) => {
    const score = getScore(qm._id);
    return client.zremrangebyscore(podName, score, score);
  });
  dependencies.queueMemberService.emitter.on('update', (qm) =>
    client.zadd(podName, getScore(qm._id), JSON.stringify(qm)),
  );
}

function getScore(_id: string) {
  return Number(`0x${_id}`);
}
