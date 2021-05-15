import * as k8s from '@kubernetes/client-node';

import { BaseApiV1 } from '../bases';

const kc = new k8s.KubeConfig();
kc.loadFromDefault();

export class SecretApiV1 extends BaseApiV1<k8s.V1Secret> {
  protected api = kc.makeApiClient(k8s.CoreV1Api);
  protected singular = 'Secret';

  protected getEndpoint(namespace: string) {
    return `/api/v1/namespaces/${namespace}/secrets`;
  }
}

export const secretApiV1 = new SecretApiV1();
