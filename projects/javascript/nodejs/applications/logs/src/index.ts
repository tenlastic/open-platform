import * as k8s from '@kubernetes/client-node';
import * as fs from 'fs';
import * as request from 'request';

import { getBody } from './get-body';
import { getMicroseconds } from './get-microseconds';
import { getUnix } from './get-unix';
import { split } from './split';

const accessToken = process.env.ACCESS_TOKEN;
const gameServerId = process.env.GAME_SERVER_ID;
const podNamespace = process.env.POD_NAMESPACE;
const podName = process.env.POD_NAME;

const kc = new k8s.KubeConfig();
kc.loadFromDefault();

const certificate = fs.readFileSync(kc.getCurrentCluster().caFile);
const server = kc.getCurrentCluster().server;
const token = fs.readFileSync(kc.getCurrentUser().authProvider.config.tokenFile, 'utf8');

// Stream logs from Kubernetes.
request
  .get({
    agentOptions: { ca: certificate },
    headers: { Authorization: `Bearer ${token}` },
    qs: {
      container: 'application',
      follow: true,
      timestamps: true,
    },
    url: `${server}/api/v1/namespaces/${podNamespace}/pods/${podName}/log`,
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
          json: { body, gameServerId, unix: timestamp },
          url: 'http://api.default:3000/logs',
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
  });
