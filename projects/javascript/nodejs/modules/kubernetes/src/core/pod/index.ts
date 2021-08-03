import * as k8s from '@kubernetes/client-node';
import { EventEmitter } from 'events';
import * as fs from 'fs';
import * as request from 'request';
import * as requestPromiseNative from 'request-promise-native';

import { BaseApiV1 } from '../../bases';
import { HttpError } from '../../errors';

export interface NamespacedPodLogOptions {
  since?: string;
  tail?: number;
}

const kc = new k8s.KubeConfig();
kc.loadFromDefault();

export class PodApiV1 extends BaseApiV1<k8s.V1Pod> {
  protected api = kc.makeApiClient(k8s.CoreV1Api);
  protected singular = 'Pod';

  public followNamespacedPodLog(
    name: string,
    namespace: string,
    container: string,
    options?: NamespacedPodLogOptions,
  ) {
    const certificate = fs.readFileSync(kc.getCurrentCluster().caFile);
    const server = kc.getCurrentCluster().server;
    const token = fs.readFileSync(kc.getCurrentUser().authProvider.config.tokenFile, 'utf8');

    // Construct querystring.
    const qs: any = { container, follow: true, limitBytes: 250000, timestamps: true };
    if (options?.since) {
      qs.sinceTime = options.since;
    } else if (options?.tail) {
      qs.tailLines = options.tail;
    }

    const emitter = new EventEmitter();
    const req = request
      .get({
        agentOptions: { ca: certificate },
        headers: { Authorization: `Bearer ${token}` },
        qs,
        url: `${server}/api/v1/namespaces/${namespace}/pods/${name}/log`,
      })
      .on('error', e => emitter.emit('error', e))
      .on('response', response => {
        if (response.statusCode !== 200) {
          const body = response.body ? JSON.parse(response.body) : null;
          emitter.emit('error', new HttpError(response.statusCode, body));
          return;
        }

        response.on('data', data => {
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
        });
        response.on('end', () => emitter.emit('end'));
      });

    return { emitter, request: req };
  }

  public async readNamespacedPodLog(
    name: string,
    namespace: string,
    container: string,
    options?: NamespacedPodLogOptions,
  ) {
    const certificate = fs.readFileSync(kc.getCurrentCluster().caFile);
    const server = kc.getCurrentCluster().server;
    const token = fs.readFileSync(kc.getCurrentUser().authProvider.config.tokenFile, 'utf8');

    // Construct querystring.
    const qs: any = { container, limitBytes: 250000, timestamps: true };
    if (options?.since) {
      qs.sinceTime = options.since;
    } else if (options?.tail) {
      qs.tailLines = options.tail;
    }

    const response: requestPromiseNative.FullResponse = await requestPromiseNative.get({
      agentOptions: { ca: certificate },
      headers: { Authorization: `Bearer ${token}` },
      qs,
      resolveWithFullResponse: true,
      simple: false,
      url: `${server}/api/v1/namespaces/${namespace}/pods/${name}/log`,
    });

    if (response.statusCode !== 200) {
      throw new HttpError(response.statusCode, response.body);
    }

    const results = [];
    const lines = this.split(response.body);

    for (const line of lines) {
      const body = this.getBody(line);
      const microseconds = this.getMicroseconds(line);
      const unix = this.getUnix(line);

      const timestamp = parseFloat(`${unix}.${microseconds}`);
      const json = { body, unix: timestamp };

      results.push(json);
    }

    return results;
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
