import { PermissionError } from '@tenlastic/mongoose-permissions';
import { Context } from '@tenlastic/web-server';

import { QueueMember, QueueMemberPermissions } from '../../../mongodb';

export async function handler(ctx: Context) {
  const credentials = { ...ctx.state };
  const $match = await QueueMemberPermissions.where(credentials, ctx.request.query.where);
  if ($match === null) {
    throw new PermissionError();
  }

  const result = await QueueMember.getUserIdCount($match);

  ctx.response.body = { count: result };
}
