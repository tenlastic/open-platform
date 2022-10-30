import * as k8s from '@kubernetes/client-node';

import { BaseApiV1 } from '../bases';

const kc = new k8s.KubeConfig();
kc.loadFromDefault();

export class ResourceQuotaApiV1 extends BaseApiV1<k8s.V1ResourceQuota> {
  protected api = kc.makeApiClient(k8s.CoreV1Api);
  protected singular = 'ResourceQuota';

  protected getEndpoint(namespace: string) {
    return `/api/v1/namespaces/${namespace}/resourcequotas`;
  }
}

export const resourceQuotaApiV1 = new ResourceQuotaApiV1();
