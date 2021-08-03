import * as k8s from '@kubernetes/client-node';
import * as deepmerge from 'deepmerge';

import { BaseResponse, BaseWatchCallback, BaseWatchDoneCallback, BaseWatchOptions } from './base';

const kc = new k8s.KubeConfig();
kc.loadFromDefault();

const customObjects = kc.makeApiClient(k8s.CustomObjectsApi);

export interface CustomObjectBaseBody {
  metadata?: {
    name?: string;
    resourceVersion?: string;
  };
}

export abstract class CustomObjectBaseApiV1<T extends CustomObjectBaseBody> {
  protected group: string;
  protected kind: string;
  protected plural: string;
  protected version: string;

  public create(namespace: string, body: T) {
    return customObjects.createNamespacedCustomObject(
      this.group,
      this.version,
      namespace,
      this.plural,
      { apiVersion: `${this.group}/${this.version}`, kind: this.kind, ...body },
    ) as Promise<BaseResponse<T>>;
  }

  public async createOrRead(namespace: string, body: T) {
    try {
      return await this.create(namespace, body);
    } catch (e) {
      if (e.response?.statusCode === 409) {
        return this.read(body.metadata.name, namespace);
      } else {
        throw e;
      }
    }
  }

  public async createOrReplace(namespace: string, body: T) {
    try {
      return await this.create(namespace, body);
    } catch (e) {
      if (e.response?.statusCode === 409) {
        return this.replace(body.metadata.name, namespace, body);
      } else {
        throw e;
      }
    }
  }

  public async delete(name: string, namespace: string) {
    try {
      return (await customObjects.deleteNamespacedCustomObject(
        this.group,
        this.version,
        namespace,
        this.plural,
        name,
      )) as BaseResponse<T>;
    } catch {}
  }

  public read(name: string, namespace: string) {
    return customObjects.getNamespacedCustomObject(
      this.group,
      this.version,
      namespace,
      this.plural,
      name,
    ) as Promise<BaseResponse<T>>;
  }

  public async replace(name: string, namespace: string, body: T) {
    const response = await this.read(name, namespace);

    const arrayMerge = (destination, source) => source;
    const copy = deepmerge(response.body, body, { arrayMerge });

    return customObjects.replaceNamespacedCustomObject(
      this.group,
      this.version,
      namespace,
      this.plural,
      name,
      { apiVersion: `${this.group}/${this.version}`, kind: this.kind, ...copy },
    ) as Promise<BaseResponse<T>>;
  }

  public async watch(
    namespace: string,
    options: BaseWatchOptions,
    callback: BaseWatchCallback<T>,
    done?: BaseWatchDoneCallback,
  ) {
    const endpoint = this.getEndpoint(namespace);
    const watch = new k8s.Watch(kc);
    const req = await watch.watch(endpoint, options, callback, done);

    // Abort the request after 5 minutes.
    await new Promise(res => setTimeout(res, 5 * 60 * 1000));
    req.abort();

    return this.watch(namespace, options, callback, done);
  }

  protected abstract getEndpoint(namespace: string): string;
}
