import { AuthorizationRequestPermissions } from '@tenlastic/mongoose';
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
  const record = await AuthorizationRequestPermissions.read(credentials, result);

  ctx.response.body = { record };
}
