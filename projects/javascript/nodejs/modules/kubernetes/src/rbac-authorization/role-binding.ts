import * as k8s from '@kubernetes/client-node';

import { BaseApiV1 } from '../bases';

const kc = new k8s.KubeConfig();
kc.loadFromDefault();

export class RoleBindingApiV1 extends BaseApiV1<k8s.V1RoleBinding> {
  protected api = kc.makeApiClient(k8s.RbacAuthorizationV1Api);
  protected singular = 'RoleBinding';
}

export const roleBindingApiV1 = new RoleBindingApiV1();
