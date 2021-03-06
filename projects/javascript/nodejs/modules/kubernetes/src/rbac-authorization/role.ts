import * as k8s from '@kubernetes/client-node';

import { BaseApiV1 } from '../bases';

const kc = new k8s.KubeConfig();
kc.loadFromDefault();

export class RoleApiV1 extends BaseApiV1<k8s.V1Role> {
  protected api = kc.makeApiClient(k8s.RbacAuthorizationV1Api);
  protected singular = 'Role';

  protected getEndpoint(namespace: string) {
    return `/apis/rbac.authorization.k8s.io/v1/namespaces/${namespace}/roles`;
  }
}

export const roleApiV1 = new RoleApiV1();
