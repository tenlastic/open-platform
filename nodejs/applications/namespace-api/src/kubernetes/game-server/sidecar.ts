import { V1EnvVar } from '@kubernetes/client-node';
import { deploymentApiV1 } from '@tenlastic/kubernetes';
import { GameServerDocument, GameServerStatusComponentName } from '@tenlastic/mongoose';

import { version } from '../../../package.json';
import { KubernetesNamespace } from '../namespace';
import { KubernetesGameServer } from './';

export const KubernetesGameServerSidecar = {
  delete: async (gameServer: GameServerDocument) => {
    const name = getName(gameServer);

    await deploymentApiV1.delete(name, 'dynamic');
  },
  upsert: async (gameServer: GameServerDocument) => {
    const labels = KubernetesGameServer.getLabels(gameServer);
    const name = getName(gameServer);

    await deploymentApiV1.delete(name, 'dynamic');

    return deploymentApiV1.createOrReplace('dynamic', {
      metadata: {
        labels: {
          ...labels,
          'tenlastic.com/role': GameServerStatusComponentName.Sidecar,
        },
        name,
      },
      spec: {
        replicas: 1,
        selector: {
          matchLabels: {
            ...labels,
            'tenlastic.com/role': GameServerStatusComponentName.Sidecar,
          },
        },
        template: getPodTemplate(gameServer),
      },
    });
  },
};

function getName(gameServer: GameServerDocument) {
  const name = KubernetesGameServer.getName(gameServer);
  return `${name}-sidecar`;
}

function getPodTemplate(gameServer: GameServerDocument) {
  const affinity = KubernetesGameServer.getAffinity(gameServer);
  const gameServerName = KubernetesGameServer.getName(gameServer);
  const labels = KubernetesGameServer.getLabels(gameServer);
  const name = getName(gameServer);
  const namespaceName = KubernetesNamespace.getName(gameServer.namespaceId);

  const apiHost = `http://${namespaceName}-api.dynamic:3000`;
  const applicationSelector = `tenlastic.com/role=${GameServerStatusComponentName.Application}`;
  const env: V1EnvVar[] = [
    {
      name: 'API_KEY',
      valueFrom: { secretKeyRef: { key: 'GAME_SERVERS', name: `${namespaceName}-api-keys` } },
    },
    { name: 'CONTAINER', value: 'application' },
    {
      name: 'ENDPOINT',
      value: `${apiHost}/namespaces/${gameServer.namespaceId}/game-servers/${gameServer._id}`,
    },
  ];

  if (KubernetesNamespace.isDevelopment) {
    return {
      metadata: {
        labels: {
          ...labels,
          'tenlastic.com/role': GameServerStatusComponentName.Sidecar,
        },
        name,
      },
      spec: {
        affinity,
        containers: [
          {
            command: ['npm', 'run', 'start'],
            env: [
              ...env,
              {
                name: 'LABEL_SELECTOR',
                value: `tenlastic.com/app=${gameServerName},${applicationSelector}`,
              },
            ],
            image: 'tenlastic/node-development:latest',
            imagePullPolicy: 'IfNotPresent',
            name: 'endpoints-sidecar',
            resources: { requests: { cpu: '25m', memory: '50M' } },
            volumeMounts: [{ mountPath: '/usr/src/', name: 'workspace' }],
            workingDir: '/usr/src/nodejs/applications/endpoints-sidecar/',
          },
          {
            command: ['npm', 'run', 'start'],
            env: [...env, { name: 'LABEL_SELECTOR', value: `tenlastic.com/app=${gameServerName}` }],
            image: 'tenlastic/node-development:latest',
            imagePullPolicy: 'IfNotPresent',
            name: 'status-sidecar',
            resources: { requests: { cpu: '25m', memory: '50M' } },
            volumeMounts: [{ mountPath: '/usr/src/', name: 'workspace' }],
            workingDir: '/usr/src/nodejs/applications/status-sidecar/',
          },
        ],
        serviceAccountName: 'game-server-sidecar',
        volumes: [
          { hostPath: { path: '/usr/src/open-platform/' }, name: 'workspace' },
        ],
      },
    };
  } else {
    return {
      metadata: {
        labels: {
          ...labels,
          'tenlastic.com/role': GameServerStatusComponentName.Sidecar,
        },
        name,
      },
      spec: {
        affinity,
        containers: [
          {
            env: [
              ...env,
              {
                name: 'LABEL_SELECTOR',
                value: `tenlastic.com/app=${gameServerName},${applicationSelector}`,
              },
            ],
            image: `tenlastic/endpoints-sidecar:${version}`,
            name: 'endpoints-sidecar',
            resources: { requests: { cpu: '25m', memory: '50M' } },
          },
          {
            env: [...env, { name: 'LABEL_SELECTOR', value: `tenlastic.com/app=${gameServerName}` }],
            image: `tenlastic/status-sidecar:${version}`,
            name: 'status-sidecar',
            resources: { requests: { cpu: '25m', memory: '50M' } },
          },
        ],
        serviceAccountName: 'game-server-sidecar',
      },
    };
  }
}
