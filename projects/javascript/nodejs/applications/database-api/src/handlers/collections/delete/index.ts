import { Context, RecordNotFoundError } from '@tenlastic/web-server';

import { Collection, CollectionPermissions, DatabasePermissions, Database } from '../../../models';

export async function handler(ctx: Context) {
  const database = await Database.findOne({ name: ctx.params.databaseName });
  if (!database) {
    throw new RecordNotFoundError('Database');
  }

  const where = await CollectionPermissions.where(
    { databaseId: database._id, name: ctx.params.name },
    ctx.state.user,
  );
  const record = await Collection.findOne(where).populate(
    CollectionPermissions.accessControl.options.populate,
  );
  if (!record) {
    throw new RecordNotFoundError('Collection');
  }

  const result = await CollectionPermissions.delete(record, ctx.state.user);

  ctx.response.body = { record: result };
}
