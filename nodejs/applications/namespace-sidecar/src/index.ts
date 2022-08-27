import { AuthorizationModel, NamespaceModel } from '@tenlastic/http';
import { WebServer } from '@tenlastic/web-server';

import dependencies from './dependencies';

import { status } from './status';

const namespace = JSON.parse(process.env.NAMESPACE_JSON);
const wssUrl = process.env.WSS_URL;

(async () => {
  try {
    // Add initial Namespace data.
    await dependencies.namespaceService.findOne(namespace._id);

    // Background Tasks.
    await status();

    // Web Socket.
    await dependencies.streamService.connect(wssUrl);

    // Watch for updates to Authorizations.
    await dependencies.streamService.subscribe(
      AuthorizationModel,
      {
        collection: 'authorizations',
        resumeToken: `namespace-${namespace._id}-sidecar`,
        where: { namespaceId: namespace._id },
      },
      dependencies.authorizationService,
      dependencies.authorizationStore,
      wssUrl,
    );

    // Watch for updates to the Namespace.
    await dependencies.streamService.subscribe(
      NamespaceModel,
      {
        collection: 'namespaces',
        resumeToken: `namespace-${namespace._id}-sidecar`,
        where: { _id: namespace._id },
      },
      dependencies.namespaceService,
      dependencies.namespaceStore,
      wssUrl,
    );

    // Web Server.
    const webServer = new WebServer();
    webServer.use((ctx) => (ctx.status = 200));
    webServer.start();
  } catch (e) {
    console.error(e.message);
    process.exit(1);
  }
})();
