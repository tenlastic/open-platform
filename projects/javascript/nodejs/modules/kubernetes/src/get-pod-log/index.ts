import * as k8s from '@kubernetes/client-node';
import { EventEmitter } from 'events';
import * as fs from 'fs';
import * as request from 'request';

import { getBody } from '../get-body';
import { getMicroseconds } from '../get-microseconds';
import { getUnix } from '../get-unix';
import { split } from '../split';

export function getPodLog(namespace: string, pod: string, container: string, since?: string) {
  const kc = new k8s.KubeConfig();
  kc.loadFromDefault();

  const certificate = fs.readFileSync(kc.getCurrentCluster().caFile);
  const server = kc.getCurrentCluster().server;
  const token = fs.readFileSync(kc.getCurrentUser().authProvider.config.tokenFile, 'utf8');

  const emitter = new EventEmitter();
  request
    .get({
      agentOptions: { ca: certificate },
      headers: { Authorization: `Bearer ${token}` },
      qs: {
        container,
        follow: true,
        sinceTime: since || new Date(0).toISOString(),
        timestamps: true,
      },
      url: `${server}/api/v1/namespaces/${namespace}/pods/${pod}/log`,
    })
    .on('data', data => {
      try {
        const string = data.toString();
        const lines = split(string);

        for (const line of lines) {
          const body = getBody(line);
          const microseconds = getMicroseconds(line);
          const unix = getUnix(line);

          const timestamp = parseFloat(`${unix}.${microseconds}`);
          const json = { body, unix: timestamp };

          emitter.emit('data', json);
        }
      } catch (e) {
        emitter.emit('error', e);
      }
    })
    .on('end', () => emitter.emit('end'))
    .on('error', e => emitter.emit('error', e));

  return emitter;
}
