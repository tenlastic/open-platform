import 'source-map-support/register';
import '@tenlastic/logging';

import { ApiError, QueueMemberModel, QueueModel } from '@tenlastic/http';

import dependencies from './dependencies';

import { createMatch } from './create-match';
import { findInitialQueueMembers } from './find-initial-queue-members';

const namespaceId = process.env.NAMESPACE_ID;
const podName = process.env.POD_NAME;
const queueId = process.env.QUEUE_ID;
const replicas = parseInt(process.env.REPLICAS, 10);
const wssUrl = process.env.WSS_URL;

(async () => {
  try {
    // Get initial Queue information.
    await dependencies.queueService.findOne(namespaceId, queueId);

    // Get initial Queue Members.
    const match = podName.match(/-(\d+)$/);
    const index = match ? parseInt(match[1], 10) : null;
    const startDate = new Date();
    const queueMembers = await findInitialQueueMembers(index, namespaceId, queueId, replicas);

    console.log(`Found ${queueMembers.length} initial Queue Members.`);

    // Web Sockets.
    const webSocket = await dependencies.webSocketService.connect(wssUrl);
    await Promise.all([
      // Watch for updates to the Queue.
      dependencies.subscriptionService.subscribe(
        QueueModel,
        { body: { resumeToken: podName, where: { _id: queueId } }, path: '/subscriptions/queues' },
        dependencies.queueService,
        dependencies.queueStore,
        webSocket,
        { acks: true },
      ),

      // Watch for updates to the Queue Members.
      dependencies.subscriptionService.subscribe(
        QueueMemberModel,
        {
          body: { startDate, where: { queueId, unix: { $mod: [replicas, index] } } },
          path: '/subscriptions/queue-members',
        },
        dependencies.queueMemberService,
        dependencies.queueMemberStore,
        webSocket,
        {
          acks: true,
          callback: (response) => {
            const { userIds } = response.body.fullDocument;

            if (response.body.operationType === 'delete') {
              console.log(`Deleted Queue Member with User IDs: ${userIds.join(',')}.`);
            } else if (response.body.operationType === 'insert') {
              console.log(`Created Queue Member with User IDs: ${userIds.join(',')}.`);
            } else {
              console.log(`Updated Queue Member with User IDs: ${userIds.join(',')}.`);
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
