import { CollectionModel, RecordPermissions, RecordSchema } from '@tenlastic/mongoose';
import { Context, subscribe } from '@tenlastic/web-socket-server';

export async function handler(ctx: Context) {
  const collection = await CollectionModel.findOne({ _id: ctx.request.params.collectionId });
  const Model = RecordSchema.getModel(collection);
  const Permissions = RecordPermissions(collection, Model);

  return subscribe(ctx, Model, Permissions);
}
