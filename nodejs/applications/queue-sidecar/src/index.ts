import { queueService, setApiKey, setApiUrl, WebSocket } from '@tenlastic/http';
import { WebServer } from '@tenlastic/web-server';

import { status } from './status';

const apiKey = process.env.API_KEY;
const apiUrl = process.env.API_URL;
const queue = JSON.parse(process.env.QUEUE_JSON);
const wssUrl = process.env.WSS_URL;

(async () => {
  setApiKey(apiKey);
  setApiUrl(apiUrl);

  // Add initial Queue data.
  await queueService.findOne(queue.namespaceId, queue._id);

  // Background Tasks.
  await status();

  // Web Socket.
  const webSocket = new WebSocket();
  webSocket.emitter.on('open', () => {
    console.log('Web socket connected.');

    // Watch for updates to the Queue.
    webSocket.subscribe(queueService.emitter, {
      collection: 'queues',
      resumeToken: `queue-${queue._id}-sidecar`,
      where: { _id: queue._id },
    });
  });
  await webSocket.connect(wssUrl);

  // Web Server.
  const webServer = new WebServer();
  webServer.use((ctx) => (ctx.status = 200));
  webServer.start();
})();
