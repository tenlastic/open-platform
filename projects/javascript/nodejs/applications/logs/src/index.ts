import * as k8s from '@kubernetes/client-node';
import * as fs from 'fs';
import * as request from 'request';
import * as requestPromiseNative from 'request-promise-native';

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

const logs: string[] = [];

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
  .on('data', data => {
    const string = data.toString();
    const lines = split(string);

    console.log(`Received lines: ${lines.length}.`);

    logs.push(...lines);
  });

// Send logs synchronously to preserve order.
async function send() {
  console.log(`Sending logs: ${logs.length}.`);

  while (logs.length) {
    const log = logs.shift();

    const response: requestPromiseNative.FullResponse = await requestPromiseNative.post({
      headers: { Authorization: `Bearer ${accessToken}` },
      json: { body: log, gameServerId },
      resolveWithFullResponse: true,
      simple: false,
      url: 'http://api.default:3000/logs',
    });

    if (response.statusCode !== 200) {
      console.error(`Received error status code: ${response.statusCode}.`);
      break;
    }

    console.log('Log saved successfully.');
  }

  setTimeout(send, 1000);
}
setTimeout(send, 1000);
