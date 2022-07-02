import { QueueMember, QueueMemberPermissions } from '@tenlastic/mongoose-models';
import { PermissionError } from '@tenlastic/mongoose-permissions';
import { Context } from 'koa';

export async function handler(ctx: Context) {
  const user = ctx.state.apiKey || ctx.state.user;

  const $match = await QueueMemberPermissions.where(ctx.request.query.where, user);
  if ($match === null) {
    throw new PermissionError();
  }

  const result = await QueueMember.getUserIdCount($match);

  ctx.response.body = { count: result };
}
