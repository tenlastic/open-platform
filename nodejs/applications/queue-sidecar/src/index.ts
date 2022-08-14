import { QueueModel } from '@tenlastic/http';
import { WebServer } from '@tenlastic/web-server';

import dependencies from './dependencies';

import { status } from './status';

const queue = JSON.parse(process.env.QUEUE_JSON);
const wssUrl = process.env.WSS_URL;

(async () => {
  // Add initial Queue data.
  await dependencies.queueService.findOne(queue.namespaceId, queue._id);

  // Background Tasks.
  await status();

  // Web Socket.
  await dependencies.streamService.connect(wssUrl);

  // Watch for updates to the Queue.
  await dependencies.streamService.subscribe(
    QueueModel,
    { collection: 'queues', resumeToken: `queue-${queue._id}-sidecar`, where: { _id: queue._id } },
    dependencies.queueService,
    dependencies.queueStore,
    wssUrl,
  );

  // Web Server.
  const webServer = new WebServer();
  webServer.use((ctx) => (ctx.status = 200));
  webServer.start();
})();
