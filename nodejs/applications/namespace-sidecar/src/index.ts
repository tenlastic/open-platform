import { namespaceService, setAccessToken, setApiUrl, WebSocket } from '@tenlastic/http';
import { WebServer } from '@tenlastic/web-server';
import * as mongoose from 'mongoose';

import { mongodb } from './mongodb';
import { status } from './status';

const accessToken = process.env.ACCESS_TOKEN;
const apiUrl = process.env.API_URL;
const namespaceId = JSON.parse(process.env.NAMESPACE_ID);
const wssUrl = process.env.WSS_URL;

(async () => {
  // Set API information.
  setAccessToken(accessToken);
  setApiUrl(apiUrl);

  // Fetch initial Namespace value.
  await namespaceService.findOne(namespaceId);

  // Start background tasks.
  mongodb();
  status();

  // Open web socket.
  const webSocket = new WebSocket();
  webSocket.emitter.on('open', () => {
    console.log('Web socket connected.');

    // Watch for updates to the Namespace.
    webSocket.subscribe(namespaceService.emitter, {
      collection: 'namespaces',
      resumeToken: `namespace-${namespaceId}-sidecar`,
      where: { _id: namespaceId },
    });
  });
  await webSocket.connect(wssUrl);

  // Start web server.
  const webServer = new WebServer();
  webServer.use((ctx) => (ctx.status = mongoose.connection.readyState === 1 ? 200 : 500));
  webServer.start();
})();
