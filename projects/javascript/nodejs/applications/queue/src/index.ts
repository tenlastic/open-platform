import 'source-map-support/register';

import {
  queueMemberService,
  queueQuery,
  queueService,
  queueStore,
  setAccessToken,
  setApiUrl,
  WebSocket,
} from '@tenlastic/http';
import { WebServer } from '@tenlastic/web-server';

import { createGameServer } from './create-game-server';
import * as redis from './redis';

const accessToken = process.env.ACCESS_TOKEN;
const apiUrl = process.env.API_URL;
const podName = process.env.POD_NAME;
const queue = JSON.parse(process.env.QUEUE_JSON);
const wssUrl = process.env.WSS_URL;

(async () => {
  try {
    setAccessToken(accessToken);
    setApiUrl(apiUrl);

    // Redis.
    await redis.start();

    // Add initial Queue data.
    await queueService.findOne(queue._id);

    // Log Queue Member changes.
    queueMemberService.emitter.on('create', record =>
      console.log(`Created Queue Member with User IDs: ${record.userIds.join(',')}.`),
    );
    queueMemberService.emitter.on('delete', _id =>
      console.log(`Deleted Queue Member User IDs: ${_id}.`),
    );

    // Web Socket.
    const webSocket = new WebSocket();
    webSocket.emitter.on('open', () => {
      console.log('Web socket connected.');

      // Watch for updates to the Queue.
      webSocket.subscribe(queueService.emitter, {
        collection: 'queues',
        resumeToken: podName,
        where: { _id: queue._id },
      });

      // Distribute new Queue Members among replicas.
      webSocket.subscribe(queueMemberService.emitter, {
        collection: 'queue-members',
        operationType: ['insert'],
        resumeToken: `queue-${queue._id}`,
        where: { queueId: queue._id },
      });

      // Get all Queue Member deletions.
      webSocket.subscribe(queueMemberService.emitter, {
        collection: 'queue-members',
        operationType: ['delete'],
        resumeToken: podName,
        where: { queueId: queue._id },
      });
    });
    await webSocket.connect(wssUrl);

    // Web Server.
    const webServer = new WebServer();
    webServer.use(ctx => (ctx.status = 200));
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
    const q = queueQuery.getEntity(queue._id);
    const result = await createGameServer(q);
    console.log(`GameServer created successfully: ${result._id}.`);

    return main();
  } catch (e) {
    if (e.name === 'StatusCodeError') {
      e.error.errors.forEach(error => console.error(error.message));
    } else if (!e.message.includes('Not enough QueueMembers.')) {
      console.error(e.message);
    }

    setTimeout(main, 5000);
  }
}
