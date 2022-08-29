import * as k8s from '@kubernetes/client-node';

import { BaseApiV1, BaseListQuery, BaseResponse } from '../bases';

const kc = new k8s.KubeConfig();
kc.loadFromDefault();

export class ServiceApiV1 extends BaseApiV1<k8s.V1Service> {
  protected api = kc.makeApiClient(k8s.CoreV1Api);
  protected singular = 'Service';

  public async deleteCollection(
    namespace: string,
    query: BaseListQuery,
  ): Promise<BaseResponse<k8s.V1Service>> {
    const response = await this.list(namespace, query);
    if (response.body.items.length === 0) {
      return;
    }

    const promises = response.body.items.map((s) => this.delete(s.metadata.name, namespace));
    await Promise.all(promises);

    return this.deleteCollection(namespace, query);
  }

  protected getEndpoint(namespace: string) {
    return `/api/v1/namespaces/${namespace}/services`;
  }
}

export const serviceApiV1 = new ServiceApiV1();
