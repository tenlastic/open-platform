import * as k8s from '@kubernetes/client-node';

import { BaseApiV1 } from '../bases';

const kc = new k8s.KubeConfig();
kc.loadFromDefault();

export class ConfigMapApiV1 extends BaseApiV1<k8s.V1ConfigMap> {
  protected api = kc.makeApiClient(k8s.CoreV1Api);
  protected singular = 'ConfigMap';

  protected getEndpoint(namespace: string) {
    return `/api/v1/namespaces/${namespace}/configmaps`;
  }
}

export const configMapApiV1 = new ConfigMapApiV1();
