import 'source-map-support/register';

import { queueMemberStore, setAccessToken, WebSocket } from '@tenlastic/http';

import { createGameServer } from './create-game-server';
import * as redis from './redis';

const accessToken = process.env.ACCESS_TOKEN;
const queue = JSON.parse(process.env.QUEUE_JSON);
const wssUrl = process.env.WSS_URL;

(async () => {
  try {
    setAccessToken(accessToken);

    await redis.start();

    const webSocket = new WebSocket();
    webSocket.emitter.on('open', () => {
      webSocket.subscribe('queue-members', queue._id, queueMemberStore, { queueId: queue._id });
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
    console.log(`${queueMemberStore.array.length} QueueMembers remaining.`);

    return main();
  } catch (e) {
    if (e.name === 'StatusCodeError') {
      e.error.errors.forEach(error => console.error(error.message));
    } else {
      console.error(e.message);
    }

    setTimeout(main, 15000);
  }
}
