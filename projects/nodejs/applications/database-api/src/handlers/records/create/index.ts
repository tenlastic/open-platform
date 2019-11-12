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

  const override = {
    collectionId: collection._id,
    databaseId: database._id,
    userId: ctx.state.user._id,
  };
  const result = await Permissions.create(ctx.request.body, override, ctx.state.user);

  ctx.response.body = { record: result };
}
