import * as k8s from '@kubernetes/client-node';
import * as fs from 'fs';
import * as request from 'request';

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

request
  .get({
    agentOptions: { ca: certificate },
    headers: { Authorization: `Bearer ${token}` },
    qs: {
      container: 'application',
      follow: true,
      tailLines: 0,
      timestamps: true,
    },
    url: `${server}/api/v1/namespaces/${podNamespace}/pods/${podName}/log`,
  })
  .on('data', data => {
    const string = data.toString();
    const lines = split(string);

    for (const line of lines) {
      request.post({
        headers: { Authorization: `Bearer ${accessToken}` },
        json: { body: line, gameServerId },
        url: 'http://api:3000/logs',
      });
    }
  });
