import { Context, RecordNotFoundError } from '@tenlastic/web-server';

import { QueueMember, QueueMemberPermissions } from '@tenlastic/mongoose-models';

export async function handler(ctx: Context) {
  const where = await QueueMemberPermissions.where(
    { _id: ctx.params._id },
    ctx.state.apiKey || ctx.state.user,
  );
  const record = await QueueMember.findOne(where).populate(
    QueueMemberPermissions.accessControl.options.populate,
  );
  if (!record) {
    throw new RecordNotFoundError('Queue Member');
  }

  const result = await QueueMemberPermissions.delete(record, ctx.state.apiKey || ctx.state.user);

  ctx.response.body = { record: result };
}
