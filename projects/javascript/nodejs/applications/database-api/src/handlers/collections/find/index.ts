import { Context, RecordNotFoundError } from '@tenlastic/web-server';

import { CollectionPermissions, Database } from '../../../models';

export async function handler(ctx: Context) {
  const database = await Database.findOne({ name: ctx.params.databaseName });
  if (!database) {
    throw new RecordNotFoundError('Database');
  }

  const override = { where: { databaseId: database._id } };
  const result = await CollectionPermissions.find(ctx.request.query, override, ctx.state.user);

  ctx.response.body = { records: result };
}
