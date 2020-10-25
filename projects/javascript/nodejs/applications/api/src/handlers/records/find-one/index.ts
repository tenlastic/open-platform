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

  const override = { where: { _id, collectionId } };
  const result = await Permissions.findOne({}, override, ctx.state.apiKey || ctx.state.user);

  if (!result) {
    throw new RecordNotFoundError('Record');
  }

  ctx.response.body = { record: result };
}
