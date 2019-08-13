import { Context, RecordNotFoundError } from '@tenlastic/api-module';

import { Collection, CollectionPermissions } from '../../../models';

export async function handler(ctx: Context) {
  const record = await Collection.findOne({ _id: ctx.params.id }).populate(
    CollectionPermissions.populateOptions,
  );

  if (!record) {
    throw new RecordNotFoundError();
  }

  const result = await CollectionPermissions.delete(record, ctx.state.user);

  ctx.response.body = { record: result };
}
