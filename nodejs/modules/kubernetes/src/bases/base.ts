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

export abstract class BaseApiV1<TApi, TBody extends BaseBody> {
  protected api: TApi;
  protected singular: string;

  public create(namespace: string, body: TBody): Promise<BaseResponse<TBody>> {
    const method = `createNamespaced${this.singular}`;
    return this.api[method](namespace, body);
  }

  public async createOrRead(namespace: string, body: TBody): Promise<BaseResponse<TBody>> {
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

  public async createOrReplace(namespace: string, body: TBody): Promise<BaseResponse<TBody>> {
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

  public async delete(name: string, namespace: string): Promise<BaseResponse<TBody>> {
    try {
      const method = `deleteNamespaced${this.singular}`;
      return await this.api[method](name, namespace);
    } catch {}
  }

  public async deleteCollection(
    namespace: string,
    query: BaseListQuery,
  ): Promise<BaseResponse<TBody>> {
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

  public async exists(name: string, namespace: string) {
    try {
      await this.read(name, namespace);
    } catch (e) {
      if (e.statusCode === 404) {
        return false;
      }

      throw e;
    }

    return true;
  }

  public list(
    namespace: string,
    query: BaseListQuery,
  ): Promise<BaseResponse<BaseListResponse<TBody>>> {
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

  public patch(name: string, namespace: string, body: Partial<TBody>) {
    const method = `patchNamespaced${this.singular}`;
    return this.api[method](name, namespace, body, undefined, undefined, undefined, undefined, {
      headers: { 'Content-Type': 'application/strategic-merge-patch+json' },
    });
  }

  public read(name: string, namespace: string): Promise<BaseResponse<TBody>> {
    const method = `readNamespaced${this.singular}`;
    return this.api[method](name, namespace);
  }

  public async replace(name: string, namespace: string, body: TBody): Promise<BaseResponse<TBody>> {
    const response = await this.read(name, namespace);

    const arrayMerge = (destination, source) => source;
    const copy = deepmerge(response.body, body, { arrayMerge });

    const method = `replaceNamespaced${this.singular}`;
    return this.api[method](name, namespace, copy);
  }

  public async watch(
    namespace: string,
    options: BaseWatchOptions,
    callback: BaseWatchCallback<TBody>,
    done?: BaseWatchDoneCallback,
  ) {
    const endpoint = this.getEndpoint(namespace);

    const watch = new Watch(endpoint, options, callback, done);
    await watch.start();

    return watch;
  }

  protected abstract getEndpoint(namespace: string): string;
}
