import { Context, RecordNotFoundError } from '@tenlastic/web-server';

import { Queue, QueuePermissions } from '@tenlastic/mongoose-models';

export async function handler(ctx: Context) {
  const where = await QueuePermissions.where({ _id: ctx.params._id }, ctx.state.user);
  const record = await Queue.findOne(where).populate(
    QueuePermissions.accessControl.options.populate,
  );
  if (!record) {
    throw new RecordNotFoundError('Queue');
  }

  const override = { namespaceId: ctx.params.namespaceId };
  const result = await QueuePermissions.update(record, ctx.request.body, override, ctx.state.user);

  ctx.response.body = { record: result };
}
