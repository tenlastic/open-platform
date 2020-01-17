import { Context, RecordNotFoundError } from '@tenlastic/web-server';

import { Collection, CollectionPermissions, Database } from '../../../models';

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

  const override = { databaseId: ctx.params.databaseId };
  const result = await CollectionPermissions.update(
    record,
    ctx.request.body,
    override,
    ctx.state.user,
  );

  ctx.response.body = { record: result };
}
