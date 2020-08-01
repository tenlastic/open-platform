import { Context, RecordNotFoundError } from '@tenlastic/web-server';

import { Queue, QueuePermissions } from '../../../models';

export async function handler(ctx: Context) {
  const where = await QueuePermissions.where({ _id: ctx.params._id }, ctx.state.user);
  const record = await Queue.findOne(where).populate(
    QueuePermissions.accessControl.options.populate,
  );
  if (!record) {
    throw new RecordNotFoundError('Queue');
  }

  const result = await QueuePermissions.delete(record, ctx.state.user);

  ctx.response.body = { record: result };
}
