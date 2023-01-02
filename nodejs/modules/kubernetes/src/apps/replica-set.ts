import * as k8s from '@kubernetes/client-node';

import { BaseApiV1 } from '../bases';

const kc = new k8s.KubeConfig();
kc.loadFromDefault();

export class ReplicaSetApiV1 extends BaseApiV1<k8s.V1ReplicaSet> {
  protected api = kc.makeApiClient(k8s.AppsV1Api);
  protected singular = 'ReplicaSet';

  protected getEndpoint(namespace: string) {
    return `/apis/apps/v1/namespaces/${namespace}/replicasets`;
  }
}

export const replicaSetApiV1 = new ReplicaSetApiV1();
