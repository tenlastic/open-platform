import { PermissionError } from '@tenlastic/mongoose-permissions';
import { Context, RecordNotFoundError } from '@tenlastic/web-server';

import { GameServerPermissions } from '../../../models';

export async function handler(ctx: Context) {
  const override = { where: { _id: ctx.params._id } };
  const result = await GameServerPermissions.findOne({}, override, ctx.state.user);

  if (!result) {
    throw new RecordNotFoundError('Game Server');
  }

  const role = GameServerPermissions.accessControl.getRole(result, ctx.state.user);
  if (role !== 'administrator') {
    throw new PermissionError();
  }

  await result.restart();

  ctx.response.body = { record: result };
}
