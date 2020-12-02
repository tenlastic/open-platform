import { PermissionError } from '@tenlastic/mongoose-permissions';
import { Context, RecordNotFoundError } from '@tenlastic/web-server';

import { GameServerPermissions } from '@tenlastic/mongoose-models';

export async function handler(ctx: Context) {
  const override = { where: { _id: ctx.params._id } };
  const user = ctx.state.apiKey || ctx.state.user;

  const result = await GameServerPermissions.findOne({}, override, user);
  if (!result) {
    throw new RecordNotFoundError('Game Server');
  }

  const role = GameServerPermissions.accessControl.getRole(result, user);
  if (role !== 'namespace-administrator' && role !== 'system-administrator') {
    throw new PermissionError();
  }

  await result.restart();

  const record = await GameServerPermissions.read(result, user);
  ctx.response.body = { record };
}
