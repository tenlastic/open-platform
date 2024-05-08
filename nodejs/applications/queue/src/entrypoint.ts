import 'source-map-support/register';
import '@tenlastic/logging';

import { ApiError, QueueMemberModel, QueueModel } from '@tenlastic/http';

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
      dependencies.webSocketService.connect(wssUrl),

      // Watch for updates to the Queue.
      dependencies.subscriptionService.subscribe(
        QueueModel,
        { body: { resumeToken: podName, where: { _id: queueId } }, path: '/subscriptions/queues' },
        dependencies.queueService,
        dependencies.queueStore,
        wssUrl,
        { acks: true },
      ),

      // Distribute new Queue Members among replicas.
      dependencies.subscriptionService.subscribe(
        QueueMemberModel,
        {
          body: { operationType: ['insert'], resumeToken: `queue-${queueId}`, where: { queueId } },
          path: '/subscriptions/queue-members',
        },
        dependencies.queueMemberService,
        dependencies.queueMemberStore,
        wssUrl,
        { acks: true, callback: (response) => redis.upsert(client, response.body.fullDocument) },
      ),

      // Get all Queue Member deletions and updates.
      dependencies.subscriptionService.subscribe(
        QueueMemberModel,
        {
          body: { operationType: ['delete', 'update'], resumeToken: podName, where: { queueId } },
          path: '/subscriptions/queue-members',
        },
        dependencies.queueMemberService,
        dependencies.queueMemberStore,
        wssUrl,
        {
          acks: true,
          callback: (response) => {
            if (response.body.operationType === 'delete') {
              return redis.remove(client, response.body.fullDocument);
            } else if (dependencies.queueMemberQuery.hasEntity(response.body.fullDocument._id)) {
              return redis.upsert(client, response.body.fullDocument);
            }
          },
        },
      ),
    ]);

    // Wait for changes to catch up before creating Matches.
    setTimeout(main, 5000);
  } catch (e) {
    console.error(e);
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
    if (e instanceof ApiError) {
      e.errors.forEach((error) => console.error(error));
    } else if (!e.message.includes('Not enough Queue Members.')) {
      console.error(e);
    }

    setTimeout(main, 5000);
  }
}
