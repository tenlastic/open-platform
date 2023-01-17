import * as deepmerge from 'deepmerge';
import { IncomingMessage } from 'http';

export interface ClusterBaseBody {
  metadata?: {
    name?: string;
    resourceVersion?: string;
  };
}

export interface ClusterBaseListQuery {
  fieldSelector?: string;
  labelSelector?: string;
}

export interface ClusterBaseResponse<T> {
  body: T;
  response: IncomingMessage;
}

export class ClusterBaseApiV1<T extends ClusterBaseBody> {
  protected api: any;
  protected singular: string;

  public create(body: T): Promise<ClusterBaseResponse<T>> {
    const method = `create${this.singular}`;
    return this.api[method](body);
  }

  public async createOrRead(body: T): Promise<ClusterBaseResponse<T>> {
    try {
      return await this.create(body);
    } catch (e) {
      if (e.response?.statusCode === 409) {
        return this.read(body.metadata.name);
      } else {
        throw e;
      }
    }
  }

  public async createOrReplace(body: T): Promise<ClusterBaseResponse<T>> {
    try {
      return await this.create(body);
    } catch (e) {
      if (e.response?.statusCode === 409) {
        return this.replace(body.metadata.name, body);
      } else {
        throw e;
      }
    }
  }

  public async delete(name: string): Promise<ClusterBaseResponse<T>> {
    try {
      const method = `delete${this.singular}`;
      return await this.api[method](name);
    } catch {}
  }

  public async deleteCollection(query: ClusterBaseListQuery): Promise<ClusterBaseResponse<T>> {
    const method = `deleteCollection${this.singular}`;
    return this.api[method](
      undefined,
      undefined,
      undefined,
      query.fieldSelector,
      undefined,
      query.labelSelector,
    );
  }

  public async exists(name: string) {
    try {
      await this.read(name);
    } catch (e) {
      if (e.statusCode === 404) {
        return false;
      }

      throw e;
    }

    return true;
  }

  public patch(name: string, body: Partial<T>) {
    const method = `patch${this.singular}`;
    return this.api[method](name, body, undefined, undefined, undefined, undefined, {
      headers: { 'Content-Type': 'application/strategic-merge-patch+json' },
    });
  }

  public read(name: string): Promise<ClusterBaseResponse<T>> {
    const method = `read${this.singular}`;
    return this.api[method](name);
  }

  public async replace(name: string, body: T): Promise<ClusterBaseResponse<T>> {
    const response = await this.read(name);

    const arrayMerge = (destination, source) => source;
    const copy = deepmerge(response.body, body, { arrayMerge });

    const method = `replace${this.singular}`;
    return this.api[method](name, copy);
  }
}
