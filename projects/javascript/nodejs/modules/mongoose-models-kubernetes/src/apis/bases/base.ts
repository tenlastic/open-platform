import * as deepmerge from 'deepmerge';
import { IncomingMessage } from 'http';

export interface BaseBody {
  metadata?: {
    name?: string;
    resourceVersion?: string;
  };
}

export interface BaseResponse<T> {
  body: T;
  response: IncomingMessage;
}

export class BaseApiV1<T extends BaseBody> {
  protected api: object;
  protected singular: string;

  public create(namespace: string, body: T): Promise<BaseResponse<T>> {
    const method = `createNamespaced${this.singular}`;
    return this.api[method](namespace, body);
  }

  public async createOrRead(namespace: string, body: T): Promise<BaseResponse<T>> {
    try {
      return await this.create(namespace, body);
    } catch {
      return this.read(body.metadata.name, namespace);
    }
  }

  public async createOrReplace(namespace: string, body: T): Promise<BaseResponse<T>> {
    try {
      return await this.create(namespace, body);
    } catch {
      return this.replace(body.metadata.name, namespace, body);
    }
  }

  public async delete(name: string, namespace: string): Promise<BaseResponse<T>> {
    try {
      const method = `deleteNamespaced${this.singular}`;
      return await this.api[method](name, namespace);
    } catch {}
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
}
