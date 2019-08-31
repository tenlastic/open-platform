import { Context, RecordNotFoundError } from '@tenlastic/web-server';

import { Database, DatabasePermissions } from '../../../models';

export async function handler(ctx: Context) {
  const where = await DatabasePermissions.where({ _id: ctx.params.id }, ctx.state.user);
  const record = await Database.findOne(where).populate(DatabasePermissions.populateOptions);

  if (!record) {
    throw new RecordNotFoundError('Database');
  }

  const result = await DatabasePermissions.delete(record, ctx.state.user);

  ctx.response.body = { record: result };
}
