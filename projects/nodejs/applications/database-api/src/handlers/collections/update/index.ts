import { Context, RecordNotFoundError } from '@tenlastic/web-server';

import { Collection, CollectionPermissions } from '../../../models';

export async function handler(ctx: Context) {
  const where = await CollectionPermissions.where({ _id: ctx.params.id }, ctx.state.user);
  const record = await Collection.findOne(where).populate(CollectionPermissions.populateOptions);

  if (!record) {
    throw new RecordNotFoundError('Collection');
  }

  const override = { databaseId: ctx.params.databaseId };
  const result = await CollectionPermissions.update(
    record,
    ctx.request.body,
    override,
    ctx.state.user,
  );

  ctx.response.body = { record: result };
}
