import { AuthorizationPermissions, AuthorizationRequestPermissions } from '@tenlastic/mongoose';
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

  const result = await AuthorizationRequestPermissions.update(
    credentials,
    ctx.params,
    ctx.request.body,
    existing,
  );

  if (result.deniedAt && result.wasModified('deniedAt')) {
    const params = ctx.params.namespaceId ? { namespaceId: ctx.params.namespaceId } : {};
    const authorization = await AuthorizationPermissions.findOne(
      credentials,
      { where: params },
      { where: { ...params, userId: existing.userId } },
    );

    if (authorization) {
      const roles = authorization.roles.filter((r) => !result.roles.includes(r));
      await AuthorizationPermissions.update(credentials, params, { roles }, authorization);
    }
  } else if (result.grantedAt && result.wasModified('grantedAt')) {
    const params = ctx.params.namespaceId ? { namespaceId: ctx.params.namespaceId } : {};
    const authorization = await AuthorizationPermissions.findOne(
      credentials,
      { where: params },
      { where: { ...params, userId: existing.userId } },
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
  }

  const record = await AuthorizationRequestPermissions.read(credentials, result);

  ctx.response.body = { record };
}
