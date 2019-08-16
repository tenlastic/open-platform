import { MongoosePermissions } from '@tenlastic/mongoose-permissions';
import { Context, RecordNotFoundError } from '@tenlastic/web-server';

import { Collection, RecordDocument, RecordSchema } from '../../../models';

export async function handler(ctx: Context) {
  const { collectionId, databaseId, id } = ctx.params;

  const collection = await Collection.findOne({ _id: collectionId });
  if (!collection) {
    throw new RecordNotFoundError();
  }

  const Model = RecordSchema.getModelForClass(collection);
  const Permissions = new MongoosePermissions<RecordDocument>(Model, collection.permissions);

  const override = { where: { _id: id, collectionId, databaseId } };
  const result = await Permissions.findOne({}, override, ctx.state.user);

  if (!result) {
    throw new RecordNotFoundError();
  }

  ctx.response.body = { record: result };
}
