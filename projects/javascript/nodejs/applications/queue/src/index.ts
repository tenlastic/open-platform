import 'source-map-support/register';

import { createGameServer } from './create-game-server';
import * as redis from './redis';
import { queueMemberStore } from './stores';
import { WebSocket } from './websocket';

const queue = JSON.parse(process.env.QUEUE_JSON);

(async () => {
  await redis.start();

  const webSocket = new WebSocket();
  webSocket.emitter.on('open', () => {
    webSocket.subscribe('queue-members', queueMemberStore, { queueId: queue._id });
  });
  webSocket.connect();

  // Wait for changes from web socket to catch up.
  setTimeout(main, 15000);
})();

async function main() {
  try {
    const result = await createGameServer(queue);

    console.log(`GameServer created successfully: ${result._id}.`);
    console.log(`${queueMemberStore.items.length} QueueMembers remaining.`);

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
