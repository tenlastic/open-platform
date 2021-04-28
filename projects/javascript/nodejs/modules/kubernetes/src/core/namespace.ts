import * as k8s from '@kubernetes/client-node';
import * as deepmerge from 'deepmerge';

const kc = new k8s.KubeConfig();
kc.loadFromDefault();

const coreV1Api = kc.makeApiClient(k8s.CoreV1Api);

export class NamespaceApiV1 {
  protected api: object;
  protected singular: string;

  public create(body: k8s.V1Namespace) {
    return coreV1Api.createNamespace(body);
  }

  public async createOrRead(body: k8s.V1Namespace) {
    try {
      return await this.create(body);
    } catch {
      return this.read(body.metadata.name);
    }
  }

  public async createOrReplace(body: k8s.V1Namespace) {
    try {
      return await this.create(body);
    } catch {
      return this.replace(body.metadata.name, body);
    }
  }

  public async delete(name: string) {
    try {
      return coreV1Api.deleteNamespace(name);
    } catch {}
  }

  public patch(name: string, body: Partial<k8s.V1Namespace>) {
    return coreV1Api.patchNamespace(name, body, undefined, undefined, undefined, undefined, {
      headers: { 'Content-Type': 'application/strategic-merge-patch+json' },
    });
  }

  public read(name: string) {
    return coreV1Api.readNamespace(name);
  }

  public async replace(name: string, body: k8s.V1Namespace) {
    const response = await this.read(name);

    const arrayMerge = (destination, source) => source;
    const copy = deepmerge(response.body, body, { arrayMerge });

    return coreV1Api.replaceNamespace(name, copy);
  }
}

export const namespaceApiV1 = new NamespaceApiV1();
