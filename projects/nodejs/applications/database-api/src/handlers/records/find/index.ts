import { MongoosePermissions } from '@tenlastic/mongoose-permissions';
import { Context, RecordNotFoundError } from '@tenlastic/web-server';

import { Collection, RecordDocument, RecordSchema } from '../../../models';

export async function handler(ctx: Context) {
  const { collectionId, databaseId } = ctx.params;

  const collection = await Collection.findOne({ _id: collectionId });
  if (!collection) {
    throw new RecordNotFoundError('Collection');
  }

  const Model = RecordSchema.getModelForClass(collection);
  const Permissions = new MongoosePermissions<RecordDocument>(Model, collection.permissions);

  const override = { where: { collectionId, databaseId } };
  const result = await Permissions.find(ctx.request.query, override, ctx.state.user);

  ctx.response.body = { records: result };
}
