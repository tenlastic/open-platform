import { V1PodTemplateSpec } from '@kubernetes/client-node';
import { deploymentApiV1, networkPolicyApiV1, podApiV1, serviceApiV1 } from '@tenlastic/kubernetes';
import { URL } from 'url';

import { GameServerDocument } from '../mongodb';

export const KubernetesGameServer = {
  delete: async (gameServer: GameServerDocument) => {
    const name = KubernetesGameServer.getName(gameServer);

    /**
     * =======================
     * NETWORK POLICY
     * =======================
     */
    await networkPolicyApiV1.delete(name, 'dynamic');

    /**
     * =======================
     * SERVICE
     * =======================
     */
    await serviceApiV1.delete(name, 'dynamic');

    /**
     * =======================
     * DEPLOYMENT OR POD
     * =======================
     */
    await deploymentApiV1.delete(name, 'dynamic');
    await podApiV1.delete(name, 'dynamic');

    /**
     * =======================
     * DEVELOPMENT SERVICE
     * =======================
     */
    await serviceApiV1.delete(`${name}-node-port`, 'dynamic');
  },
  getLabels: (gameServer: GameServerDocument) => {
    const name = KubernetesGameServer.getName(gameServer);
    return {
      'tenlastic.com/app': name,
      'tenlastic.com/gameServerId': `${gameServer._id}`,
      'tenlastic.com/namespaceId': `${gameServer.namespaceId}`,
    };
  },
  getName: (gameServer: GameServerDocument) => {
    return `game-server-${gameServer._id}`;
  },
  upsert: async (gameServer: GameServerDocument) => {
    const labels = KubernetesGameServer.getLabels(gameServer);
    const name = KubernetesGameServer.getName(gameServer);

    /**
     * =======================
     * NETWORK POLICY
     * =======================
     */
    await networkPolicyApiV1.createOrReplace('dynamic', {
      metadata: {
        labels: { ...labels, 'tenlastic.com/role': 'application' },
        name,
      },
      spec: {
        egress: [{ to: [{ podSelector: { matchLabels: { 'tenlastic.com/app': name } } }] }],
        podSelector: { matchLabels: { 'tenlastic.com/app': name } },
        policyTypes: ['Egress'],
      },
    });

    /**
     * =======================
     * SERVICE
     * =======================
     */
    await serviceApiV1.createOrReplace('dynamic', {
      metadata: {
        labels: { ...labels, 'tenlastic.com/role': 'application' },
        name,
      },
      spec: {
        ports: [{ name: 'tcp', port: 7777 }],
        selector: { ...labels, 'tenlastic.com/role': 'application' },
      },
    });

    /**
     * =======================
     * DEPLOYMENT OR POD
     * =======================
     */
    const url = new URL(process.env.DOCKER_REGISTRY_URL);
    const image = `${url.host}/${gameServer.namespaceId}:${gameServer.buildId}`;

    const affinity = {
      nodeAffinity: {
        requiredDuringSchedulingIgnoredDuringExecution: {
          nodeSelectorTerms: [
            {
              matchExpressions: [
                {
                  key: gameServer.preemptible
                    ? 'tenlastic.com/low-priority'
                    : 'tenlastic.com/high-priority',
                  operator: 'Exists',
                },
              ],
            },
          ],
        },
      },
    };

    const max = 32767;
    const min = 30000;
    const hostPort = Math.round(Math.random() * (max - min) + min);

    const manifest: V1PodTemplateSpec = {
      metadata: {
        labels: { ...labels, 'tenlastic.com/role': 'application' },
        name,
      },
      spec: {
        affinity,
        automountServiceAccountToken: false,
        containers: [
          {
            env: [
              { name: 'GAME_SERVER_ID', value: `${gameServer._id}` },
              { name: 'GAME_SERVER_JSON', value: JSON.stringify(gameServer) },
            ],
            image,
            name: 'main',
            ports: [
              { containerPort: 7777, hostPort, protocol: 'TCP' },
              { containerPort: 7777, hostPort, protocol: 'UDP' },
            ],
            resources: {
              limits: { cpu: `${gameServer.cpu}`, memory: `${gameServer.memory}` },
              requests: { cpu: `${gameServer.cpu}`, memory: `${gameServer.memory}` },
            },
          },
        ],
        enableServiceLinks: false,
        imagePullSecrets: [{ name: 'docker-registry' }],
        restartPolicy: gameServer.persistent ? 'Always' : 'Never',
      },
    };

    if (gameServer.persistent) {
      await deploymentApiV1.delete(name, 'dynamic');
      await deploymentApiV1.createOrReplace('dynamic', {
        metadata: {
          labels: { ...labels, 'tenlastic.com/role': 'application' },
          name,
        },
        spec: {
          replicas: 1,
          selector: { matchLabels: { ...labels, 'tenlastic.com/role': 'application' } },
          template: manifest,
        },
      });
    } else {
      await podApiV1.delete(name, 'dynamic');
      await podApiV1.createOrReplace('dynamic', manifest);
    }

    /**
     * =======================
     * DEVELOPMENT SERVICE
     * =======================
     */
    if (process.env.PWD && process.env.PWD.includes('/usr/src/nodejs/')) {
      await serviceApiV1.createOrReplace('dynamic', {
        metadata: {
          labels: { ...labels, 'tenlastic.com/role': 'application' },
          name: `${name}-node-port`,
        },
        spec: {
          ports: [
            { name: 'tcp', nodePort: hostPort, port: 7777, protocol: 'TCP' },
            { name: 'udp', nodePort: hostPort, port: 7777, protocol: 'UDP' },
          ],
          selector: { ...labels, 'tenlastic.com/role': 'application' },
          type: 'NodePort',
        },
      });
    }
  },
};
