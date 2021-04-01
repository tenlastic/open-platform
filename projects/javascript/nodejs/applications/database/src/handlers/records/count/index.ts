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

  const result = await Permissions.count(
    ctx.request.query.where,
    { collectionId, databaseId },
    user,
  );

  ctx.response.body = { count: result };
}
