import { MongoosePermissions } from '@tenlastic/mongoose-permissions';
import { Context, RecordNotFoundError } from '@tenlastic/web-server';

import { Collection, Database, RecordDocument, RecordSchema } from '../../../models';

export async function handler(ctx: Context) {
  const { collectionName, databaseName } = ctx.params;

  const database = await Database.findOne({ name: databaseName });
  if (!database) {
    throw new RecordNotFoundError('Database');
  }

  const collection = await Collection.findOne({ databaseId: database._id, name: collectionName });
  if (!collection) {
    throw new RecordNotFoundError('Collection');
  }

  const Model = RecordSchema.getModelForClass(collection);
  const Permissions = new MongoosePermissions<RecordDocument>(Model, collection.permissions);

  const override = { where: { collectionId: collection._id, databaseId: database._id } };
  const result = await Permissions.find(ctx.request.query, override, ctx.state.user);

  ctx.response.body = { records: result };
}
