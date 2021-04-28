import { WebServer } from '@tenlastic/web-server';

import { logs } from './logs';
import { status } from './status';

(async () => {
  // Background Tasks.
  await logs();
  await status();

  // Web Server.
  const webServer = new WebServer();
  webServer.use(ctx => (ctx.status = 200));
  webServer.start();
})();
