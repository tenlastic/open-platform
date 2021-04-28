import * as k8s from '@kubernetes/client-node';

import { BaseApiV1 } from '../bases';

const kc = new k8s.KubeConfig();
kc.loadFromDefault();

export class ServiceAccountApiV1 extends BaseApiV1<k8s.V1ServiceAccount> {
  protected api = kc.makeApiClient(k8s.CoreV1Api);
  protected singular = 'ServiceAccount';
}

export const serviceAccountApiV1 = new ServiceAccountApiV1();
