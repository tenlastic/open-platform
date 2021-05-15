import * as k8s from '@kubernetes/client-node';

import { BaseApiV1 } from '../bases';

const kc = new k8s.KubeConfig();
kc.loadFromDefault();

export class ServiceApiV1 extends BaseApiV1<k8s.V1Service> {
  protected api = kc.makeApiClient(k8s.CoreV1Api);
  protected singular = 'Service';

  protected getEndpoint(namespace: string) {
    return `/api/v1/namespaces/${namespace}/services`;
  }
}

export const serviceApiV1 = new ServiceApiV1();
