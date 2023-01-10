import {
  AuthorizationModel,
  AuthorizationDocument,
  AuthorizationRole,
  NamespaceDocument,
} from '@tenlastic/mongoose';
import { Chance } from 'chance';
import * as mongoose from 'mongoose';

const chance = new Chance();

export const KubernetesNamespaceAuthorizations = {
  upsert: async (namespace: NamespaceDocument) => {
    return Promise.all([
      upsertAuthorization('System (Builds)', namespace._id, [
        AuthorizationRole.BuildsRead,
        AuthorizationRole.BuildsWrite,
      ]),
      upsertAuthorization('System (Game Servers)', namespace._id, [
        AuthorizationRole.GameServersRead,
        AuthorizationRole.GameServersWrite,
      ]),
      upsertAuthorization('System (Namespaces)', namespace._id, [
        AuthorizationRole.NamespacesRead,
        AuthorizationRole.NamespacesWrite,
      ]),
      upsertAuthorization('System (Queues)', namespace._id, [
        AuthorizationRole.GameServersRead,
        AuthorizationRole.GameServersWrite,
        AuthorizationRole.MatchesRead,
        AuthorizationRole.MatchesWrite,
        AuthorizationRole.QueuesRead,
        AuthorizationRole.QueuesWrite,
      ]),
      upsertAuthorization('System (Workflows)', namespace._id, [
        AuthorizationRole.WorkflowsRead,
        AuthorizationRole.WorkflowsWrite,
      ]),
    ]);
  },
};

async function upsertAuthorization(
  name: string,
  namespaceId: mongoose.Types.ObjectId,
  roles: AuthorizationRole[],
): Promise<AuthorizationDocument> {
  const apiKey = chance.hash({ length: 64 });

  try {
    return await AuthorizationModel.create({ apiKey, name, namespaceId, roles, system: true });
  } catch (e) {
    if (e.name !== 'DuplicateKeyError') {
      throw e;
    }

    return await AuthorizationModel.findOne({ name, namespaceId });
  }
}
