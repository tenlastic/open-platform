import {
  AuthorizationDocument,
  AuthorizationModel,
  AuthorizationPermissionOptions,
  NamespaceModel,
} from '@tenlastic/mongoose';
import * as permissions from '@tenlastic/mongoose-permissions';
import { CreateContext } from '@tenlastic/web-server';

export async function handler(ctx: CreateContext<AuthorizationDocument>) {
  const { namespaceId } = ctx.params;
  const { apiKey, userId } = ctx.request.body;

  if (namespaceId) {
    const namespace = await NamespaceModel.findOne({ _id: namespaceId });
    namespace.checkDefaultAuthorizationLimit(!apiKey && !userId);
  }

  const context = {
    credentials: { ...ctx.state },
    Model: AuthorizationModel,
    options: AuthorizationPermissionOptions,
  };
  const result = await permissions.create(context, ctx.request.body, ctx.params);
  const record = await permissions.read(context, result);

  ctx.response.body = { record };
}
