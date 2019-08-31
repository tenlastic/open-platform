import { MongoosePermissions } from '@tenlastic/mongoose-permissions';
import { Context, RecordNotFoundError } from '@tenlastic/web-server';

import { Collection, RecordDocument, RecordSchema } from '../../../models';

export async function handler(ctx: Context) {
  const { collectionId, databaseId, id } = ctx.params;

  const collection = await Collection.findOne({ _id: collectionId });
  if (!collection) {
    throw new RecordNotFoundError('Collection');
  }

  const Model = RecordSchema.getModelForClass(collection);
  const Permissions = new MongoosePermissions<RecordDocument>(Model, collection.permissions);

  const query = { _id: id, collectionId, databaseId };
  const where = Permissions.where(query, ctx.state.user);
  const record = await Model.findOne(where).populate(Permissions.populateOptions);

  if (!record) {
    throw new RecordNotFoundError('Record');
  }

  const result = await Permissions.delete(record, ctx.state.user);

  ctx.response.body = { record: result };
}
