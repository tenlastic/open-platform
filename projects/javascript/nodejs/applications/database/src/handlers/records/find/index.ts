import { CollectionPermissions, RecordSchema } from '@tenlastic/mongoose-models';
import { Context, RecordNotFoundError } from '@tenlastic/web-server';

export async function handler(ctx: Context) {
  const { collectionId, databaseId } = ctx.params;
  const user = ctx.state.apiKey || ctx.state.user;

  const collection = await CollectionPermissions.findOne(
    {},
    { where: { _id: collectionId, databaseId } },
    user,
  );
  if (!collection) {
    throw new RecordNotFoundError('Collection');
  }

  const Model = RecordSchema.getModel(collection);
  const Permissions = RecordSchema.getPermissions(Model, collection);

  try {
    const results = await Permissions.find(
      ctx.request.query,
      { where: { collectionId, databaseId } },
      ctx.state.apiKey || ctx.state.user,
    );
    const records = await Promise.all(results.map(r => Permissions.read(r, user)));

    ctx.response.body = { records };
  } catch (e) {
    console.error(e.stack);
  }
}
