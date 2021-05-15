import * as k8s from '@kubernetes/client-node';

import { BaseApiV1 } from '../bases';

const kc = new k8s.KubeConfig();
kc.loadFromDefault();

export class StatefulSetApiV1 extends BaseApiV1<k8s.V1StatefulSet> {
  protected api = kc.makeApiClient(k8s.AppsV1Api);
  protected singular = 'StatefulSet';

  protected getEndpoint(namespace: string) {
    return `/apis/apps/v1/namespaces/${namespace}/statefulsets`;
  }
}

export const statefulSetApiV1 = new StatefulSetApiV1();
