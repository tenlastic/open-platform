import * as k8s from '@kubernetes/client-node';
import * as deepmerge from 'deepmerge';
import { IncomingMessage } from 'http';

export interface BaseBody {
  metadata?: {
    name?: string;
    resourceVersion?: string;
  };
}

export interface BaseListQuery {
  fieldSelector?: string;
  labelSelector?: string;
  limit?: number;
}

export interface BaseListResponse<T> {
  items: T[];
}

export interface BaseResponse<T> {
  body: T;
  response: IncomingMessage;
}

export type BaseWatchAction = 'ADDED' | 'DELETED' | 'MODIFIED';
export type BaseWatchCallback<T> = (action: BaseWatchAction, object: T) => void | Promise<void>;
export type BaseWatchDoneCallback = (err: any) => void;

export interface BaseWatchOptions {
  fieldSelector?: string;
  labelSelector?: string;
  resourceVersion?: string;
}

export abstract class BaseApiV1<T extends BaseBody> {
  protected api: object;
  protected singular: string;

  public create(namespace: string, body: T): Promise<BaseResponse<T>> {
    const method = `createNamespaced${this.singular}`;
    return this.api[method](namespace, body);
  }

  public async createOrRead(namespace: string, body: T): Promise<BaseResponse<T>> {
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

  public async createOrReplace(namespace: string, body: T): Promise<BaseResponse<T>> {
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

  public async delete(name: string, namespace: string): Promise<BaseResponse<T>> {
    try {
      const method = `deleteNamespaced${this.singular}`;
      return await this.api[method](name, namespace);
    } catch {}
  }

  public list(namespace: string, query: BaseListQuery): Promise<BaseResponse<BaseListResponse<T>>> {
    const method = `listNamespaced${this.singular}`;
    return this.api[method](
      namespace,
      undefined,
      undefined,
      undefined,
      query.fieldSelector,
      query.labelSelector,
      query.limit,
    );
  }

  public patch(name: string, namespace: string, body: Partial<T>) {
    const method = `patchNamespaced${this.singular}`;
    return this.api[method](name, namespace, body, undefined, undefined, undefined, undefined, {
      headers: { 'Content-Type': 'application/strategic-merge-patch+json' },
    });
  }

  public read(name: string, namespace: string): Promise<BaseResponse<T>> {
    const method = `readNamespaced${this.singular}`;
    return this.api[method](name, namespace);
  }

  public async replace(name: string, namespace: string, body: T): Promise<BaseResponse<T>> {
    const response = await this.read(name, namespace);

    const arrayMerge = (destination, source) => source;
    const copy = deepmerge(response.body, body, { arrayMerge });

    const method = `replaceNamespaced${this.singular}`;
    return this.api[method](name, namespace, copy);
  }

  public async watch(
    namespace: string,
    options: BaseWatchOptions,
    callback: BaseWatchCallback<T>,
    done?: BaseWatchDoneCallback,
  ) {
    let resourceVersion: string;

    const kc = new k8s.KubeConfig();
    kc.loadFromDefault();

    const endpoint = this.getEndpoint(namespace);
    const watch = new k8s.Watch(kc);
    const req = await watch.watch(
      endpoint,
      { ...options, allowWatchBookmarks: true },
      (type, resource) => {
        // Remember the resource version for later.
        resourceVersion = resource.metadata.resourceVersion;

        // Do not propagate bookmark events.
        if (type !== 'BOOKMARK') {
          callback(type as BaseWatchAction, resource);
        }
      },
      done,
    );

    // Abort the request after 5 minutes.
    await new Promise(res => setTimeout(res, 5 * 60 * 1000));
    req.abort();

    // Start another watch with the most recent resource version.
    return this.watch(namespace, { ...options, resourceVersion }, callback, done);
  }

  protected abstract getEndpoint(namespace: string): string;
}
