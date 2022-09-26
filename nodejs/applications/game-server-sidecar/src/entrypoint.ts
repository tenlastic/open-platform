import { WebServer } from '@tenlastic/web-server';

import { status } from './status';

(async () => {
  // Background Tasks.
  await status();

  // Web Server.
  const webServer = new WebServer();
  webServer.use(ctx => (ctx.status = 200));
  webServer.start();
})();
