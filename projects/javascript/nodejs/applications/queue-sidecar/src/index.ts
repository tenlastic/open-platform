import { queueService, setAccessToken, setApiUrl, WebSocket } from '@tenlastic/http';
import { WebServer } from '@tenlastic/web-server';

import { status } from './status';

const accessToken = process.env.ACCESS_TOKEN;
const apiUrl = process.env.API_URL;
const queue = JSON.parse(process.env.QUEUE_JSON);
const wssUrl = process.env.WSS_URL;

(async () => {
  setAccessToken(accessToken);
  setApiUrl(apiUrl);

  // Add initial Queue data.
  const result = await queueService.findOne(queue._id);
  console.log(`Initial Queue state: ${result}.`);

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
