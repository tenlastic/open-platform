import { Collection, RecordPermissions, RecordSchema } from '@tenlastic/mongoose';
import { Context, RecordNotFoundError } from '@tenlastic/web-server';

export async function handler(ctx: Context) {
  const { collectionId } = ctx.params;

  const collection = await Collection.findOne({ _id: collectionId });
  if (!collection) {
    throw new RecordNotFoundError('Collection');
  }

  const Model = RecordSchema.getModel(collection);
  const Permissions = RecordPermissions(collection, Model);

  const credentials = { ...ctx.state };
  const result = await Permissions.count(credentials, { collectionId }, ctx.request.query.where);

  ctx.response.body = { count: result };
}
