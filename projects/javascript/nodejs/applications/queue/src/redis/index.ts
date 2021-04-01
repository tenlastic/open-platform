import { queueMemberStore } from '@tenlastic/http';
import * as redis from 'redis';
import { promisify } from 'util';

const podName = process.env.POD_NAME;
const redisConnectionString = process.env.REDIS_CONNECTION_STRING;

export async function start() {
  // Connect to Redis.
  const client = redis.createClient({ url: redisConnectionString });
  client.on('connect', () => console.log('Connected to Redis.'));
  client.on('error', err => console.error(err.message));

  // Fetch existing QueueMembers from Redis.
  const zrange = promisify(client.zrange).bind(client);
  const queueMembers = await zrange(podName, 0, -1);
  if (queueMembers) {
    console.log(`Retrieved ${queueMembers.length} existing QueueMembers.`);

    for (const queueMember of queueMembers) {
      const json = JSON.parse(queueMember);
      queueMemberStore.insert(json);
    }
  }

  // Sync QueueMembers with Redis.
  const zadd = promisify(client.zadd).bind(client);
  const zremrangebyscore = promisify(client.zremrangebyscore).bind(client);

  queueMemberStore.emitter.on('delete', qm => {
    const score = getScore(qm._id);
    return zremrangebyscore(podName, score, score);
  });
  queueMemberStore.emitter.on('insert', qm => zadd(podName, getScore(qm._id), JSON.stringify(qm)));
  queueMemberStore.emitter.on('update', qm => zadd(podName, getScore(qm._id), JSON.stringify(qm)));
}

function getScore(_id: string) {
  return Number(`0x${_id}`);
}
