import { QueueMember, QueueMemberPermissions } from '@tenlastic/mongoose-models';
import { PermissionError } from '@tenlastic/mongoose-permissions';
import { Context } from 'koa';

export async function handler(ctx: Context) {
  const user = ctx.state.apiKey || ctx.state.user;

  const $match = await QueueMemberPermissions.where(ctx.request.query.where, user);
  if ($match === null) {
    throw new PermissionError();
  }

  const results = await QueueMember.aggregate([
    { $match: QueueMember.find().cast(QueueMember, $match) },
    { $unwind: '$userIds' },
    { $count: 'count' },
  ]);

  ctx.response.body = { count: results && results[0] ? results[0].count : 0 };
}
