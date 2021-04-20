import { WebServer } from '@tenlastic/web-server';

import { logs } from './logs';

(async () => {
  // Background Tasks.
  await logs();

  // Web Server.
  const webServer = new WebServer();
  webServer.use(ctx => (ctx.status = 200));
  webServer.start();
})();
