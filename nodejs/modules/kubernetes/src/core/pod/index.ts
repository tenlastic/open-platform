import * as k8s from '@kubernetes/client-node';
import axios, { AxiosError } from 'axios';
import { EventEmitter } from 'events';
import * as fs from 'fs';
import * as https from 'https';
import { Readable } from 'stream';

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

  public async followNamespacedPodLog(
    name: string,
    namespace: string,
    container: string,
    options?: NamespacedPodLogOptions,
  ) {
    const certificate = fs.readFileSync(kc.getCurrentCluster().caFile);
    const server = kc.getCurrentCluster().server;
    const token = fs.readFileSync(kc.getCurrentUser().authProvider.config.tokenFile, 'utf8');

    // Construct querystring.
    const params: any = { container, follow: true, limitBytes: 250000, timestamps: true };
    if (options?.since) {
      params.sinceTime = options.since;
    } else if (options?.tail) {
      params.tailLines = options.tail;
    }

    const emitter = new EventEmitter();
    const cancelTokenSource = axios.CancelToken.source();

    try {
      const response = await axios(`${server}/api/v1/namespaces/${namespace}/pods/${name}/log`, {
        cancelToken: cancelTokenSource.token,
        headers: { Authorization: `Bearer ${token}` },
        httpsAgent: new https.Agent({ ca: certificate }),
        params,
        responseType: 'stream',
      });

      response.data
        .on('error', (e) => emitter.emit('error', e))
        .on('data', (data) => {
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
        .on('end', () => emitter.emit('end'));

      return { cancelTokenSource, emitter };
    } catch (e) {
      if (e instanceof AxiosError) {
        const body = await this.getStringFromStream(e.response.data);
        const json = body ? JSON.parse(body) : null;
        emitter.emit('error', new HttpError(e.response.status, json));
      }
    }
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
    const params: any = { container, limitBytes: 250000, timestamps: true };
    if (options?.since) {
      params.sinceTime = options.since;
    } else if (options?.tail) {
      params.tailLines = options.tail;
    }

    const response = await axios({
      headers: { Authorization: `Bearer ${token}` },
      httpsAgent: new https.Agent({ ca: certificate }),
      method: 'get',
      params,
      url: `${server}/api/v1/namespaces/${namespace}/pods/${name}/log`,
    });

    if (response.status !== 200) {
      throw new HttpError(response.status, response.data);
    }

    const results = [];
    const lines = this.split(response.data);

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

  private getStringFromStream(stream: Readable) {
    const chunks = [];

    return new Promise<string>((resolve, reject) => {
      stream.on('data', (chunk) => chunks.push(Buffer.from(chunk)));
      stream.on('error', (err) => reject(err));
      stream.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')));
    });
  }

  private getUnix(value: string) {
    const matches = value.match(/^([0-9-]{10}T[0-9:]{8}\.[0-9]{3}[0-9]+Z)/m);
    return matches ? new Date(matches[1]).getTime() : null;
  }

  private split(value: string) {
    return value
      .split(/^([0-9-]{10}T[0-9:]{8}\.[0-9]+Z .*)$/m)
      .map((line) => line.replace(/\n/g, ''))
      .filter((line) => line);
  }
}

export const podApiV1 = new PodApiV1();
