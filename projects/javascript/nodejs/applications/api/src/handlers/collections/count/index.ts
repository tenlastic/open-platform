import { Context, RecordNotFoundError } from '@tenlastic/web-server';

import { CollectionPermissions, Database } from '@tenlastic/mongoose-models';

export async function handler(ctx: Context) {
  const database = await Database.findOne({ name: ctx.params.databaseName });
  if (!database) {
    throw new RecordNotFoundError('Database');
  }

  const override = { databaseId: database._id };
  const result = await CollectionPermissions.count(
    ctx.request.query.where,
    override,
    ctx.state.user,
  );

  ctx.response.body = { count: result };
}
