import * as deepmerge from 'deepmerge';
import { IncomingMessage } from 'http';

export interface ClusterBaseBody {
  metadata?: {
    name?: string;
    resourceVersion?: string;
  };
}

export interface ClusterBaseResponse<T> {
  body: T;
  response: IncomingMessage;
}

export class ClusterBaseApiV1<T extends ClusterBaseBody> {
  protected api: object;
  protected singular: string;

  public create(body: T): Promise<ClusterBaseResponse<T>> {
    const method = `createCluster${this.singular}`;
    return this.api[method](body);
  }

  public async createOrRead(body: T): Promise<ClusterBaseResponse<T>> {
    try {
      return await this.create(body);
    } catch {
      return this.read(body.metadata.name);
    }
  }

  public async createOrReplace(body: T): Promise<ClusterBaseResponse<T>> {
    try {
      return await this.create(body);
    } catch {
      return this.replace(body.metadata.name, body);
    }
  }

  public async delete(name: string): Promise<ClusterBaseResponse<T>> {
    try {
      const method = `deleteCluster${this.singular}`;
      return await this.api[method](name);
    } catch {}
  }

  public patch(name: string, body: Partial<T>) {
    const method = `patchCluster${this.singular}`;
    return this.api[method](name, body, undefined, undefined, undefined, undefined, {
      headers: { 'Content-Type': 'application/strategic-merge-patch+json' },
    });
  }

  public read(name: string): Promise<ClusterBaseResponse<T>> {
    const method = `readCluster${this.singular}`;
    return this.api[method](name);
  }

  public async replace(name: string, body: T): Promise<ClusterBaseResponse<T>> {
    const response = await this.read(name);

    const arrayMerge = (destination, source) => source;
    const copy = deepmerge(response.body, body, { arrayMerge });

    const method = `replaceCluster${this.singular}`;
    return this.api[method](name, copy);
  }
}
