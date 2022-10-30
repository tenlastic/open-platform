import * as k8s from '@kubernetes/client-node';

import { ClusterBaseApiV1 } from '../bases';

const kc = new k8s.KubeConfig();
kc.loadFromDefault();

export class PriorityClassApiV1 extends ClusterBaseApiV1<k8s.V1PriorityClass> {
  protected api = kc.makeApiClient(k8s.SchedulingV1Api);
  protected singular = 'PriorityClass';

  protected getEndpoint() {
    return `/api/scheduling.k8s.io/priorityclasses`;
  }
}

export const priorityClassApiV1 = new PriorityClassApiV1();
