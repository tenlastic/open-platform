import * as k8s from '@kubernetes/client-node';

import { serviceAccountApiV1 } from '../core';
import { roleApiV1, roleBindingApiV1 } from '../rbac-authorization';

export class RoleStackApiV1 {
  public async create(namespace: string, body: k8s.V1Role) {
    const role = await roleApiV1.create(namespace, body);
    const roleBinding = await roleBindingApiV1.create(
      namespace,
      this.getRoleBinding(body.metadata.name, namespace),
    );
    const serviceAccount = await serviceAccountApiV1.create(
      namespace,
      this.getServiceAccount(body.metadata.name),
    );

    return { role, roleBinding, serviceAccount };
  }

  public async createOrReplace(namespace: string, body: k8s.V1Role) {
    const role = await roleApiV1.createOrReplace(namespace, body);
    const roleBinding = await roleBindingApiV1.createOrReplace(
      namespace,
      this.getRoleBinding(body.metadata.name, namespace),
    );
    const serviceAccount = await serviceAccountApiV1.createOrReplace(
      namespace,
      this.getRoleBinding(body.metadata.name, namespace),
    );

    return { role, roleBinding, serviceAccount };
  }

  public async delete(name: string, namespace: string) {
    await roleApiV1.delete(name, namespace);
    await roleBindingApiV1.delete(name, namespace);
    await serviceAccountApiV1.delete(name, namespace);
  }

  public async read(name: string, namespace: string) {
    const role = await roleApiV1.read(name, namespace);
    const roleBinding = await roleBindingApiV1.read(name, namespace);
    const serviceAccount = await serviceAccountApiV1.read(name, namespace);

    return { role, roleBinding, serviceAccount };
  }

  public async replace(name: string, namespace: string, body: k8s.V1Role) {
    const role = await roleApiV1.replace(name, namespace, body);
    const roleBinding = await roleBindingApiV1.replace(
      name,
      namespace,
      this.getRoleBinding(name, namespace),
    );
    const serviceAccount = await serviceAccountApiV1.replace(
      name,
      namespace,
      this.getServiceAccount(name),
    );

    return { role, roleBinding, serviceAccount };
  }

  private getRoleBinding(name: string, namespace: string) {
    return {
      metadata: { name },
      roleRef: {
        apiGroup: 'rbac.authorization.k8s.io',
        kind: 'Role',
        name,
      },
      subjects: [{ kind: 'ServiceAccount', name, namespace }],
    };
  }

  private getServiceAccount(name) {
    return { metadata: { name } };
  }
}

export const roleStackApiV1 = new RoleStackApiV1();
