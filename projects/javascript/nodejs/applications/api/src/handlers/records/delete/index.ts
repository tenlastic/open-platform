import { MongoosePermissions } from '@tenlastic/mongoose-permissions';
import { Context, RecordNotFoundError } from '@tenlastic/web-server';

import { Collection, RecordDocument, RecordSchema } from '@tenlastic/mongoose-models';

export async function handler(ctx: Context) {
  const { _id, collectionId } = ctx.params;

  const collection = await Collection.findOne({ _id: collectionId });
  if (!collection) {
    throw new RecordNotFoundError('Collection');
  }

  const Model = RecordSchema.getModelForClass(collection);
  const Permissions = new MongoosePermissions<RecordDocument>(Model, collection.permissions);

  const query = { _id, collectionId };
  const where = await Permissions.where(query, ctx.state.apiKey || ctx.state.user);
  const record = await Model.findOne(where).populate(Permissions.accessControl.options.populate);

  if (!record) {
    throw new RecordNotFoundError('Record');
  }

  const result = await Permissions.delete(record, ctx.state.apiKey || ctx.state.user);

  ctx.response.body = { record: result };
}
