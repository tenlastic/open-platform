import { CollectionModel, RecordPermissions, RecordSchema } from '@tenlastic/mongoose';
import { Context, RecordNotFoundError } from '@tenlastic/web-server';

export async function handler(ctx: Context) {
  const { collectionId } = ctx.params;

  const collection = await CollectionModel.findOne({ _id: collectionId });
  if (!collection) {
    throw new RecordNotFoundError('Collection');
  }

  const Model = RecordSchema.getModel(collection);
  const Permissions = RecordPermissions(collection, Model);

  const credentials = { ...ctx.state };
  const results = await Permissions.find(
    credentials,
    { where: { collectionId } },
    ctx.request.query,
  );
  const records = await Promise.all(results.map((r) => Permissions.read(credentials, r)));

  ctx.response.body = { records };
}
