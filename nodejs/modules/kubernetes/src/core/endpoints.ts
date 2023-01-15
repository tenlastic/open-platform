import * as k8s from '@kubernetes/client-node';

import { BaseApiV1 } from '../bases';

const kc = new k8s.KubeConfig();
kc.loadFromDefault();

export class EndpointsApiV1 extends BaseApiV1<k8s.V1Endpoints> {
  protected api = kc.makeApiClient(k8s.CoreV1Api);
  protected singular = 'Endpoints';

  protected getEndpoint(namespace: string) {
    return `/api/v1/namespaces/${namespace}/endpoints`;
  }
}

export const endpointsApiV1 = new EndpointsApiV1();
