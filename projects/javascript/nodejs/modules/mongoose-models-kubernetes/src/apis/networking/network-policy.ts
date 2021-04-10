import * as k8s from '@kubernetes/client-node';

import { BaseApiV1 } from '../bases';

const kc = new k8s.KubeConfig();
kc.loadFromDefault();

export class NetworkPolicyApiV1 extends BaseApiV1<k8s.V1NetworkPolicy> {
  protected api = kc.makeApiClient(k8s.NetworkingV1Api);
  protected singular = 'NetworkPolicy';
}

export const networkPolicyApiV1 = new NetworkPolicyApiV1();
