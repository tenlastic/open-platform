import * as k8s from '@kubernetes/client-node';

import { serviceAccountApiV1 } from '../core';
import { clusterRoleApiV1, clusterRoleBindingApiV1 } from '../rbac-authorization';

export class ClusterRoleStackApiV1 {
  public async create(namespace: string, body: k8s.V1ClusterRole) {
    const clusterRole = await clusterRoleApiV1.create(body);
    const clusterRoleBinding = await clusterRoleBindingApiV1.create(
      this.getClusterRoleBinding(body.metadata, namespace),
    );
    const serviceAccount = await serviceAccountApiV1.create(
      namespace,
      this.getServiceAccount(body.metadata),
    );

    return { clusterRole, clusterRoleBinding, serviceAccount };
  }

  public async createOrReplace(namespace: string, body: k8s.V1ClusterRole) {
    const clusterRole = await clusterRoleApiV1.createOrReplace(body);
    const clusterRoleBinding = await clusterRoleBindingApiV1.createOrReplace(
      this.getClusterRoleBinding(body.metadata, namespace),
    );
    const serviceAccount = await serviceAccountApiV1.createOrReplace(
      namespace,
      this.getServiceAccount(body.metadata),
    );

    return { clusterRole, clusterRoleBinding, serviceAccount };
  }

  public async delete(name: string, namespace: string) {
    await clusterRoleApiV1.delete(name);
    await clusterRoleBindingApiV1.delete(name);
    await serviceAccountApiV1.delete(name, namespace);
  }

  public async read(name: string, namespace: string) {
    const clusterRole = await clusterRoleApiV1.read(name);
    const clusterRoleBinding = await clusterRoleBindingApiV1.read(name);
    const serviceAccount = await serviceAccountApiV1.read(name, namespace);

    return { clusterRole, clusterRoleBinding, serviceAccount };
  }

  public async replace(name: string, namespace: string, body: k8s.V1ClusterRole) {
    const clusterRole = await clusterRoleApiV1.replace(name, body);
    const clusterRoleBinding = await clusterRoleBindingApiV1.replace(
      name,
      this.getClusterRoleBinding(body.metadata, namespace),
    );
    const serviceAccount = await serviceAccountApiV1.replace(
      name,
      namespace,
      this.getServiceAccount(body.metadata),
    );

    return { clusterRole, clusterRoleBinding, serviceAccount };
  }

  private getClusterRoleBinding(metadata: k8s.V1ObjectMeta, namespace: string) {
    return {
      metadata,
      roleRef: {
        apiGroup: 'rbac.authorization.k8s.io',
        kind: 'ClusterRole',
        name: metadata.name,
      },
      subjects: [{ kind: 'ServiceAccount', name: metadata.name, namespace }],
    };
  }

  private getServiceAccount(metadata: k8s.V1ObjectMeta) {
    return { metadata };
  }
}

export const clusterRoleStackApiV1 = new ClusterRoleStackApiV1();
