import * as k8s from '@kubernetes/client-node';
import { EventEmitter } from 'events';
import * as fs from 'fs';
import * as request from 'request';

import { BaseApiV1 } from '../../bases';

const kc = new k8s.KubeConfig();
kc.loadFromDefault();

export class PodApiV1 extends BaseApiV1<k8s.V1Pod> {
  protected api = kc.makeApiClient(k8s.CoreV1Api);
  protected singular = 'Pod';

  public readNamespacedPodLog(name: string, namespace: string, container: string, since?: string) {
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
        url: `${server}/api/v1/namespaces/${namespace}/pods/${name}/log`,
      })
      .on('data', data => {
        const string = data.toString();
        const lines = this.split(string);

        for (const line of lines) {
          const body = this.getBody(line);
          const microseconds = this.getMicroseconds(line);
          const unix = this.getUnix(line);

          const timestamp = parseFloat(`${unix}.${microseconds}`);
          const json = { body, unix: timestamp };

          emitter.emit('data', json);
        }
      })
      .on('end', () => emitter.emit('end'))
      .on('error', e => emitter.emit('error', e));

    return emitter;
  }

  protected getEndpoint(namespace: string) {
    return `/api/v1/namespaces/${namespace}/pods`;
  }

  private getBody(value: string) {
    const matches = value.match(/^[0-9-]{10}T[0-9:]{8}\.[0-9]{3}[0-9]+Z (.*)/m);
    return matches ? matches[1] : value;
  }

  private getMicroseconds(value: string) {
    const matches = value.match(/^[0-9-]{10}T[0-9:]{8}\.[0-9]{3}([0-9]+)Z/m);
    return matches ? parseInt(matches[1], 10) : null;
  }

  private getUnix(value: string) {
    const matches = value.match(/^([0-9-]{10}T[0-9:]{8}\.[0-9]{3}[0-9]+Z)/m);
    return matches ? new Date(matches[1]).getTime() : null;
  }

  private split(value: string) {
    return value
      .split(/^([0-9-]{10}T[0-9:]{8}\.[0-9]+Z .*)$/m)
      .map(line => line.replace(/\n/g, ''))
      .filter(line => line);
  }
}

export const podApiV1 = new PodApiV1();
