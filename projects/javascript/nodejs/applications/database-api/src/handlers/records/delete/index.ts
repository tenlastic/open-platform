import { MongoosePermissions } from '@tenlastic/mongoose-permissions';
import { Context, RecordNotFoundError } from '@tenlastic/web-server';

import { Collection, Database, RecordDocument, RecordSchema } from '../../../models';

export async function handler(ctx: Context) {
  const { _id, collectionName, databaseName } = ctx.params;

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

  const query = { _id, collectionId: collection._id, databaseId: database._id };
  const where = await Permissions.where(query, ctx.state.user);
  const record = await Model.findOne(where).populate(Permissions.accessControl.options.populate);

  if (!record) {
    throw new RecordNotFoundError('Record');
  }

  const result = await Permissions.delete(record, ctx.state.user);

  ctx.response.body = { record: result };
}
