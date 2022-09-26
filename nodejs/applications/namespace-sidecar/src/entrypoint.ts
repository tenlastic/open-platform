import { WebServer } from '@tenlastic/web-server';

import { status } from './status';

(async () => {
  try {
    // Background Tasks.
    await status();

    // Web Server.
    const webServer = new WebServer();
    webServer.use((ctx) => (ctx.status = 200));
    webServer.start();
  } catch (e) {
    console.error(e.message);
    process.exit(1);
  }
})();
