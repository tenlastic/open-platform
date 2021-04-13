import 'source-map-support/register';

import { queueMemberStore, setAccessToken, WebSocket } from '@tenlastic/http';

import { createGameServer } from './create-game-server';
import * as redis from './redis';

const accessToken = process.env.ACCESS_TOKEN;
const podName = process.env.POD_NAME;
const queue = JSON.parse(process.env.QUEUE_JSON);
const wssUrl = process.env.WSS_URL;

(async () => {
  try {
    setAccessToken(accessToken);

    await redis.start();

    const webSocket = new WebSocket();
    webSocket.emitter.on('open', () => {
      console.log('Web socket connected.');

      // Distribute new Queue Members among replicas.
      webSocket.subscribe(
        {
          collection: 'queue-members',
          operationType: ['insert'],
          resumeToken: queue._id,
          where: { queueId: queue._id },
        },
        queueMemberStore,
      );

      // Get all Queue Member deletions.
      webSocket.subscribe(
        {
          collection: 'queue-members',
          operationType: ['delete'],
          resumeToken: podName,
          where: { queueId: queue._id },
        },
        queueMemberStore,
      );
    });
    webSocket.connect(wssUrl);

    // Wait for changes from web socket to catch up.
    setTimeout(main, 15000);
  } catch (e) {
    console.error(e.message);
    process.exit(1);
  }
})();

async function main() {
  try {
    const result = await createGameServer(queue);
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
