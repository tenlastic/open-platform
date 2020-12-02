import * as k8s from '@kubernetes/client-node';
import * as fs from 'fs';
import { IncomingMessage } from 'http';
import * as request from 'request';

import { getBody } from './get-body';
import { getMicroseconds } from './get-microseconds';
import { getUnix } from './get-unix';
import { split } from './split';

const INTERVAL = 5000;

const accessToken = process.env.ACCESS_TOKEN;
const gameServerId = process.env.GAME_SERVER_ID;
const podNamespace = process.env.POD_NAMESPACE;
const podSelector = process.env.POD_SELECTOR;

const kc = new k8s.KubeConfig();
kc.loadFromDefault();

const coreV1Api = kc.makeApiClient(k8s.CoreV1Api);

const certificate = fs.readFileSync(kc.getCurrentCluster().caFile);
const server = kc.getCurrentCluster().server;
const token = fs.readFileSync(kc.getCurrentUser().authProvider.config.tokenFile, 'utf8');

(async function main() {
  let pods: { body: k8s.V1PodList; response: IncomingMessage };
  try {
    pods = await coreV1Api.listNamespacedPod(podNamespace, null, null, null, podSelector);
  } catch (e) {
    console.error(`Error fetching pods: ${e.message}.`);
    setTimeout(main, INTERVAL);
    return;
  }

  const pod = pods.body.items[0];
  if (pod) {
    console.log(`Pod Name: ${pod.metadata.name} - Pod Namespace: ${podNamespace}`);
  } else {
    console.error(`Could not find pods with selector: ${podSelector}.`);
    setTimeout(main, INTERVAL);
    return;
  }

  // Fetch the most recent Log.
  let logs: any[];
  try {
    logs = await getMostRecentLogs();
  } catch (e) {
    console.error(`Could not fetch most recent Logs: ${e.message}.`);
    setTimeout(main, INTERVAL);
    return;
  }

  // Stream logs from Kubernetes.
  request
    .get({
      agentOptions: { ca: certificate },
      headers: { Authorization: `Bearer ${token}` },
      qs: {
        container: 'application',
        follow: true,
        sinceTime: logs[0] ? logs[0].createdAt : new Date(0).toISOString(),
        timestamps: true,
      },
      url: `${server}/api/v1/namespaces/${podNamespace}/pods/${pod.metadata.name}/log`,
    })
    .on('data', async data => {
      const string = data.toString();
      const lines = split(string);

      console.log(`Received lines: ${lines.length}.`);

      for (const line of lines) {
        const body = getBody(line);
        const microseconds = getMicroseconds(line);
        const unix = getUnix(line);

        const timestamp = parseFloat(`${unix}.${microseconds}`);

        request.post(
          {
            headers: { Authorization: `Bearer ${accessToken}` },
            json: { body, unix: timestamp },
            url: `http://api.default:3000/game-servers/${gameServerId}/logs`,
          },
          (err, response) => {
            if (err) {
              console.error(err);
              return;
            }

            if (response.statusCode !== 200) {
              console.error(`Received error status code: ${response.statusCode}.`);
              return;
            }
          },
        );
      }
    })
    .on('end', () => setTimeout(main, INTERVAL))
    .on('error', e => {
      console.error(e);
      setTimeout(main, INTERVAL);
    });
})();

function getMostRecentLogs(): Promise<any[]> {
  return new Promise((resolve, reject) => {
    const query = { sort: '-createdAt', where: { gameServerId } };

    request.get(
      {
        headers: { Authorization: `Bearer ${accessToken}` },
        qs: { query: JSON.stringify(query) },
        url: 'http://api.default:3000/logs',
      },
      (err, response) => {
        if (err) {
          return reject(err);
        } else if (response.statusCode !== 200) {
          return reject(`Received error status code: ${response.statusCode}.`);
        }

        return resolve(response.body.records);
      },
    );
  });
}
