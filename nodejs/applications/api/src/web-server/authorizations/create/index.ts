import { AuthorizationPermissions, NamespaceModel } from '@tenlastic/mongoose';
import { Context } from '@tenlastic/web-server';

export async function handler(ctx: Context) {
  const { namespaceId } = ctx.params;
  const { apiKey, userId } = ctx.request.body;

  if (namespaceId) {
    const namespace = await NamespaceModel.findOne({ _id: namespaceId });
    namespace.checkDefaultAuthorizationLimit(!apiKey && !userId);
  }

  const credentials = { ...ctx.state };
  const result = await AuthorizationPermissions.create(credentials, ctx.params, ctx.request.body);
  const record = await AuthorizationPermissions.read(credentials, result);

  ctx.response.body = { record };
}
