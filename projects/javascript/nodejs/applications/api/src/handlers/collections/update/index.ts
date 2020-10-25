import { Context, RecordNotFoundError } from '@tenlastic/web-server';

import { Collection, CollectionPermissions } from '@tenlastic/mongoose-models';

export async function handler(ctx: Context) {
  const where = await CollectionPermissions.where({ _id: ctx.params._id }, ctx.state.user);
  const record = await Collection.findOne(where).populate(
    CollectionPermissions.accessControl.options.populate,
  );
  if (!record) {
    throw new RecordNotFoundError('Collection');
  }

  const result = await CollectionPermissions.update(record, ctx.request.body, {}, ctx.state.user);

  ctx.response.body = { record: result };
}
