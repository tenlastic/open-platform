import { Context, RecordNotFoundError } from '@tenlastic/web-server';

import { CollectionPermissions, Database } from '../../../models';

export async function handler(ctx: Context) {
  const database = await Database.findOne({ name: ctx.params.databaseName });
  if (!database) {
    throw new RecordNotFoundError('Database');
  }

  const override = { where: { databaseId: database._id, name: ctx.params.name } };
  const result = await CollectionPermissions.findOne({}, override, ctx.state.user);
  if (!result) {
    throw new RecordNotFoundError('Collection');
  }

  ctx.response.body = { record: result };
}
