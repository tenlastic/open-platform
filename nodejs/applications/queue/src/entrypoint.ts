import 'source-map-support/register';
import '@tenlastic/logging';

import { QueueMemberModel, QueueModel } from '@tenlastic/http';

import dependencies from './dependencies';

import { createMatch } from './create-match';
import * as redis from './redis';

const namespaceId = process.env.NAMESPACE_ID;
const podName = process.env.POD_NAME;
const queueId = process.env.QUEUE_ID;
const wssUrl = process.env.WSS_URL;

(async () => {
  try {
    // Get initial Queue data.
    const queue = await dependencies.queueService.findOne(namespaceId, queueId);

    // Redis.
    const client = await redis.start(queue);

    // Log Queue Member changes.
    dependencies.queueMemberService.emitter.on('create', (record) =>
      console.log(`Created Queue Member with User IDs: ${record.userIds.join(',')}.`),
    );
    dependencies.queueMemberService.emitter.on('delete', (record) =>
      console.log(`Deleted Queue Member User IDs: ${record.userIds.join(',')}.`),
    );

    // Web Sockets.
    await Promise.all([
      dependencies.streamService.connect({
        apiKey: dependencies.environmentService.apiKey,
        url: wssUrl,
      }),

      // Watch for updates to the Queue.
      dependencies.streamService.subscribe(
        QueueModel,
        { body: { resumeToken: podName, where: { _id: queueId } }, path: '/subscriptions/queues' },
        dependencies.queueService,
        dependencies.queueStore,
        wssUrl,
      ),

      // Distribute new Queue Members among replicas.
      dependencies.streamService.subscribe(
        QueueMemberModel,
        {
          body: { operationType: ['insert'], resumeToken: `queue-${queueId}`, where: { queueId } },
          path: '/subscriptions/queue-members',
        },
        dependencies.queueMemberService,
        dependencies.queueMemberStore,
        wssUrl,
        (payload) => redis.upsert(client, payload.body.fullDocument),
      ),

      // Get all Queue Member deletions and updates.
      dependencies.streamService.subscribe(
        QueueMemberModel,
        {
          body: { operationType: ['delete', 'update'], resumeToken: podName, where: { queueId } },
          path: '/subscriptions/queue-members',
        },
        dependencies.queueMemberService,
        dependencies.queueMemberStore,
        wssUrl,
        (payload) => {
          if (payload.body.operationType === 'delete') {
            return redis.remove(client, payload.body.fullDocument);
          } else if (dependencies.queueMemberQuery.hasEntity(payload.body.fullDocument._id)) {
            return redis.upsert(client, payload.body.fullDocument);
          }
        },
      ),
    ]);

    // Wait for changes to catch up before creating Matches.
    setTimeout(main, 5000);
  } catch (e) {
    console.error(e.message);
    process.exit(1);
  }
})();

async function main() {
  try {
    const queue = dependencies.queueQuery.getEntity(queueId);

    const result = await createMatch(queue);
    console.log(`Match created successfully: ${result._id}.`);

    return main();
  } catch (e) {
    if (e.name === 'StatusCodeError') {
      e.error.errors.forEach((error) => console.error(error.message));
    } else if (!e.message.includes('Not enough QueueMembers.')) {
      console.error(e.message);
    }

    setTimeout(main, 5000);
  }
}
