import 'source-map-support/register';

import { QueueMemberModel, QueueModel } from '@tenlastic/http';
import { WebServer } from '@tenlastic/web-server';

import dependencies from './dependencies';

import { createGameServer } from './create-game-server';
import * as redis from './redis';

const podName = process.env.POD_NAME;
const queue = JSON.parse(process.env.QUEUE_JSON);
const wssUrl = process.env.WSS_URL;

(async () => {
  try {
    // Redis.
    await redis.start();

    // Add initial Queue data.
    await dependencies.queueService.findOne(queue.namespaceId, queue._id);

    // Log Queue Member changes.
    dependencies.queueMemberService.emitter.on('create', (record) =>
      console.log(`Created Queue Member with User IDs: ${record.userIds.join(',')}.`),
    );
    dependencies.queueMemberService.emitter.on('delete', (record) =>
      console.log(`Deleted Queue Member User IDs: ${record._id}.`),
    );

    // Web Sockets.
    await Promise.all([
      dependencies.streamService.connect(wssUrl),

      // Watch for updates to the Queue.
      dependencies.streamService.subscribe(
        QueueModel,
        { collection: 'queues', resumeToken: podName, where: { _id: queue._id } },
        dependencies.queueService,
        dependencies.queueStore,
        wssUrl,
      ),

      // Distribute new Queue Members among replicas.
      dependencies.streamService.subscribe(
        QueueMemberModel,
        {
          collection: 'queue-members',
          operationType: ['insert'],
          resumeToken: `queue-${queue._id}`,
          where: { queueId: queue._id },
        },
        dependencies.queueMemberService,
        dependencies.queueMemberStore,
        wssUrl,
      ),

      // Get all Queue Member deletions.
      dependencies.streamService.subscribe(
        QueueMemberModel,
        {
          collection: 'queue-members',
          operationType: ['delete'],
          resumeToken: podName,
          where: { queueId: queue._id },
        },
        dependencies.queueMemberService,
        dependencies.queueMemberStore,
        wssUrl,
      ),
    ]);

    // Web Server.
    const webServer = new WebServer();
    webServer.use((ctx) => (ctx.status = 200));
    webServer.start();

    // Wait for changes from web socket to catch up.
    setTimeout(main, 15000);
  } catch (e) {
    console.error(e.message);
    process.exit(1);
  }
})();

async function main() {
  try {
    const q = dependencies.queueQuery.getEntity(queue._id);
    const result = await createGameServer(q);
    console.log(`GameServer created successfully: ${result._id}.`);

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
