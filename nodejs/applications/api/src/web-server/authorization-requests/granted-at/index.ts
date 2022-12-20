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
  if (!permissions.includes('grantedAt')) {
    throw new PermissionError();
  }

  const result = await existing.set('grantedAt', new Date()).save();

  const params = ctx.params.namespaceId ? { namespaceId: ctx.params.namespaceId } : {};
  const authorization = await AuthorizationPermissions.findOne(
    credentials,
    { where: params },
    { where: { userId: existing.userId } },
  );

  if (authorization) {
    const roles = result.mergeRoles(authorization);
    await AuthorizationPermissions.update(credentials, params, { roles }, authorization);
  } else {
    await AuthorizationPermissions.create(credentials, params, {
      roles: result.roles,
      userId: result.userId,
    });
  }

  const record = await AuthorizationRequestPermissions.read(credentials, result);

  ctx.response.body = { record };
}
