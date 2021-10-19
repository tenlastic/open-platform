import 'source-map-support/register';

import '@tenlastic/logging';
import nats from '@tenlastic/nats';
import * as rabbitmq from '@tenlastic/rabbitmq';
import { WebServer } from '@tenlastic/web-server';

import {
  KubernetesBuild,
  KubernetesBuildSidecar,
  KubernetesDatabase,
  KubernetesDatabaseSidecar,
  KubernetesGameServer,
  KubernetesGameServerSidecar,
  KubernetesNamespace,
  KubernetesQueue,
  KubernetesQueueSidecar,
  KubernetesWorkflow,
  KubernetesWorkflowSidecar,
} from './models';

(async () => {
  try {
    // NATS.
    await nats.connect({ connectionString: process.env.NATS_CONNECTION_STRING });

    // RabbitMQ.
    await rabbitmq.connect({ url: process.env.RABBITMQ_CONNECTION_STRING });

    // Subscribe to NATS events.
    KubernetesBuild.subscribe();
    KubernetesBuildSidecar.subscribe();
    KubernetesDatabase.subscribe();
    KubernetesDatabaseSidecar.subscribe();
    KubernetesGameServer.subscribe();
    KubernetesGameServerSidecar.subscribe();
    KubernetesNamespace.subscribe();
    KubernetesQueue.subscribe();
    KubernetesQueueSidecar.subscribe();
    KubernetesWorkflow.subscribe();
    KubernetesWorkflowSidecar.subscribe();

    // Web Server.
    const webServer = new WebServer();
    webServer.use(ctx => (ctx.status = 200));
    webServer.start();
  } catch (e) {
    console.error(e);
    process.exit(1);
  }
})();

process.on('unhandledRejection', err => console.error(JSON.stringify(err)));
