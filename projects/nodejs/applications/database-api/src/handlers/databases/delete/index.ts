import { Context, RecordNotFoundError } from '@tenlastic/web-server';

import { Database, DatabasePermissions } from '../../../models';

export async function handler(ctx: Context) {
  const record = await Database.findOne({ _id: ctx.params.id }).populate(
    DatabasePermissions.populateOptions,
  );

  if (!record) {
    throw new RecordNotFoundError();
  }

  const result = await DatabasePermissions.delete(record, ctx.state.user);

  ctx.response.body = { record: result };
}
