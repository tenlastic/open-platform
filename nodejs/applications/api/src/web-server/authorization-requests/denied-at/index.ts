import { AuthorizationPermissions, AuthorizationRequestPermissions } from '@tenlastic/mongoose';
import { PermissionError } from '@tenlastic/mongoose-permissions';
import { Context, RecordNotFoundError } from '@tenlastic/web-server';

export async function handler(ctx: Context) {
  const credentials = { ...ctx.state };
  const existing = await AuthorizationRequestPermissions.findOne(
    credentials,
    { where: ctx.params },
    {},
  );
  if (!existing) {
    throw new RecordNotFoundError('Record');
  }

  const permissions = await AuthorizationRequestPermissions.getFieldPermissions(
    credentials,
    'update',
    existing,
  );
  if (!permissions.includes('deniedAt')) {
    throw new PermissionError();
  }

  const result = await existing.set('deniedAt', new Date()).save();

  const params = ctx.params.namespaceId ? { namespaceId: ctx.params.namespaceId } : {};
  const authorization = await AuthorizationPermissions.findOne(
    credentials,
    { where: params },
    { where: { userId: existing.userId } },
  );

  if (authorization) {
    const roles = authorization.roles.filter((r) => !result.roles.includes(r));
    await AuthorizationPermissions.update(credentials, params, { roles }, authorization);
  }

  const record = await AuthorizationRequestPermissions.read(credentials, result);

  ctx.response.body = { record };
}
