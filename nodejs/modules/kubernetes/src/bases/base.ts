import * as deepmerge from 'deepmerge';
import { IncomingMessage } from 'http';

import { BaseWatchCallback, BaseWatchDoneCallback, BaseWatchOptions, Watch } from '../watch';

export interface BaseBody {
  metadata?: {
    name?: string;
    resourceVersion?: string;
  };
}

export interface BaseListQuery {
  fieldSelector?: string;
  labelSelector?: string;
}

export interface BaseListResponse<T> {
  items: T[];
}

export interface BaseResponse<T> {
  body: T;
  response: IncomingMessage;
}

export abstract class BaseApiV1<T extends BaseBody> {
  protected api: any;
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

  public async deleteCollection(namespace: string, query: BaseListQuery): Promise<BaseResponse<T>> {
    const method = `deleteCollectionNamespaced${this.singular}`;
    return this.api[method](
      namespace,
      undefined,
      undefined,
      undefined,
      query.fieldSelector,
      undefined,
      query.labelSelector,
    );
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
    const endpoint = this.getEndpoint(namespace);

    const watch = new Watch(endpoint, options, callback, done);
    await watch.start();

    return watch;
  }

  protected abstract getEndpoint(namespace: string): string;
}
