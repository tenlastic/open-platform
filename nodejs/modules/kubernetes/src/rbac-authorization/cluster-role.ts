import * as k8s from '@kubernetes/client-node';

import { ClusterBaseApiV1 } from '../bases';

const kc = new k8s.KubeConfig();
kc.loadFromDefault();

export class ClusterRoleApiV1 extends ClusterBaseApiV1<k8s.V1ClusterRole> {
  protected api = kc.makeApiClient(k8s.RbacAuthorizationV1Api);
  protected singular = 'ClusterRole';
}

export const clusterRoleApiV1 = new ClusterRoleApiV1();
