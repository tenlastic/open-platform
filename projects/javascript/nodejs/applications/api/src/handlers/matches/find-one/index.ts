import { Context, RecordNotFoundError } from '@tenlastic/web-server';

import { MatchPermissions } from '../../../models';

export async function handler(ctx: Context) {
  const override = { where: { _id: ctx.params._id } };
  const result = await MatchPermissions.findOne({}, override, ctx.state.user);
  if (!result) {
    throw new RecordNotFoundError('Match');
  }

  ctx.response.body = { record: result };
}
