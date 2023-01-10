import { V1PodTemplateSpec, V1Probe } from '@kubernetes/client-node';
import { deploymentApiV1, podApiV1, serviceApiV1 } from '@tenlastic/kubernetes';
import {
  GameServerDocument,
  GameServerProbesProbeDocument,
  GameServerStatusComponentName,
  MatchDocument,
} from '@tenlastic/mongoose';
import { URL } from 'url';

import { KubernetesNamespace } from '../namespace';
import { KubernetesGameServer } from './';

export const KubernetesGameServerApplication = {
  delete: async (gameServer: GameServerDocument) => {
    const name = KubernetesGameServer.getName(gameServer);

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
  upsert: async (gameServer: GameServerDocument, match: MatchDocument) => {
    const affinity = KubernetesGameServer.getAffinity(gameServer);
    const labels = KubernetesGameServer.getLabels(gameServer);
    const name = KubernetesGameServer.getName(gameServer);
    const namespaceName = KubernetesNamespace.getName(gameServer.namespaceId);

    /**
     * =======================
     * DEPLOYMENT OR POD
     * =======================
     */
    const url = new URL(process.env.DOCKER_REGISTRY_URL);
    const image = `${url.host}/${gameServer.namespaceId}:${gameServer.buildId}`;
    const ports = gameServer.ports.map((p) => {
      return { containerPort: p.port, hostPort: getHostPort(), protocol: p.protocol };
    });

    const manifest: V1PodTemplateSpec = {
      metadata: {
        labels: { ...labels, 'tenlastic.com/role': GameServerStatusComponentName.Application },
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
            ports,
            resources: {
              limits: { cpu: `${gameServer.cpu}`, memory: `${gameServer.memory}` },
              requests: { cpu: `${gameServer.cpu}`, memory: `${gameServer.memory}` },
            },
          },
        ],
        enableServiceLinks: false,
        imagePullSecrets: [{ name: 'docker-registry' }],
        priorityClassName: namespaceName,
        restartPolicy: gameServer.persistent ? 'Always' : 'Never',
      },
    };

    if (gameServer.probes) {
      if (gameServer.probes.liveness) {
        manifest.spec.containers[0].livenessProbe = getProbeManifest(gameServer.probes.liveness);
      }

      if (gameServer.probes.readiness) {
        manifest.spec.containers[0].readinessProbe = getProbeManifest(gameServer.probes.readiness);
      }
    }

    if (match) {
      manifest.spec.containers[0].env.push({ name: 'MATCH_ID', value: `${match._id}` });
      manifest.spec.containers[0].env.push({ name: 'MATCH_JSON', value: JSON.stringify(match) });
    }

    if (gameServer.persistent) {
      await deploymentApiV1.delete(name, 'dynamic');
      await deploymentApiV1.createOrReplace('dynamic', {
        metadata: {
          labels: { ...labels, 'tenlastic.com/role': GameServerStatusComponentName.Application },
          name,
        },
        spec: {
          replicas: 1,
          selector: {
            matchLabels: {
              ...labels,
              'tenlastic.com/role': GameServerStatusComponentName.Application,
            },
          },
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
    if (KubernetesNamespace.isDevelopment) {
      await serviceApiV1.createOrReplace('dynamic', {
        metadata: {
          labels: { ...labels, 'tenlastic.com/role': GameServerStatusComponentName.Application },
          name: `${name}-node-port`,
        },
        spec: {
          ports: ports.map((p) => {
            return {
              name: `${p.containerPort}-${p.protocol.toLowerCase()}`,
              nodePort: p.hostPort,
              port: p.containerPort,
              protocol: p.protocol,
            };
          }),
          selector: { ...labels, 'tenlastic.com/role': GameServerStatusComponentName.Application },
          type: 'NodePort',
        },
      });
    }
  },
};

function getHostPort() {
  const maximum = 32767;
  const minimum = 30000;

  return Math.round(Math.random() * (maximum - minimum) + minimum);
}

function getProbeManifest(probe: GameServerProbesProbeDocument) {
  const manifest: V1Probe = {
    failureThreshold: probe.failureThreshold,
    initialDelaySeconds: probe.initialDelaySeconds,
    periodSeconds: probe.periodSeconds,
    successThreshold: probe.successThreshold,
    timeoutSeconds: probe.timeoutSeconds,
  };

  if (probe.exec) {
    manifest.exec = probe.exec;
  }

  if (probe.http) {
    manifest.httpGet = {
      httpHeaders: probe.http.headers,
      path: probe.http.path,
      port: probe.http.port as any,
      scheme: probe.http.scheme,
    };
  }

  if (probe.tcp) {
    manifest.tcpSocket = { port: probe.tcp.port as any };
  }

  return manifest;
}
