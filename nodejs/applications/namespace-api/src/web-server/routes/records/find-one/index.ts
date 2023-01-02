import { CollectionModel, RecordPermissions, RecordSchema } from '@tenlastic/mongoose';
import { Context, RecordNotFoundError } from '@tenlastic/web-server';

export async function handler(ctx: Context) {
  const { _id, collectionId } = ctx.params;

  const collection = await CollectionModel.findOne({ _id: collectionId });
  if (!collection) {
    throw new RecordNotFoundError('Collection');
  }

  const Model = RecordSchema.getModel(collection);
  const Permissions = RecordPermissions(collection, Model);

  const credentials = { ...ctx.state };
  const result = await Permissions.findOne(credentials, { where: { _id, collectionId } }, {});
  if (!result) {
    throw new RecordNotFoundError('Record');
  }

  const record = await Permissions.read(credentials, result);

  ctx.response.body = { record };
}
