import * as k8s from '@kubernetes/client-node';

import { ClusterBaseApiV1 } from '../bases';

const kc = new k8s.KubeConfig();
kc.loadFromDefault();

export class ClusterRoleBindingApiV1 extends ClusterBaseApiV1<k8s.V1ClusterRoleBinding> {
  protected api = kc.makeApiClient(k8s.RbacAuthorizationV1Api);
  protected singular = 'ClusterRoleBinding';
}

export const clusterRoleBindingApiV1 = new ClusterRoleBindingApiV1();
