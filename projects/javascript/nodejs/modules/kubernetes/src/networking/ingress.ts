import * as k8s from '@kubernetes/client-node';

import { BaseApiV1 } from '../bases';

const kc = new k8s.KubeConfig();
kc.loadFromDefault();

export class IngressApiV1 extends BaseApiV1<k8s.V1Ingress> {
  protected api = kc.makeApiClient(k8s.NetworkingV1Api);
  protected singular = 'Ingress';
}

export const ingressApiV1 = new IngressApiV1();
