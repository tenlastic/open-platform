import { Context, RecordNotFoundError } from '@tenlastic/web-server';

import { Database, DatabasePermissions } from '../../../models';

export async function handler(ctx: Context) {
  const where = await DatabasePermissions.where({ name: ctx.params.name }, ctx.state.user);
  const record = await Database.findOne(where).populate(
    DatabasePermissions.accessControl.options.populate,
  );

  if (!record) {
    throw new RecordNotFoundError('Database');
  }

  const result = await DatabasePermissions.delete(record, ctx.state.user);

  ctx.response.body = { record: result };
}
