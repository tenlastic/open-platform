import { Collection, CollectionPermissions, RecordSchema } from '@tenlastic/mongoose-models';
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

  const override = { collectionId, databaseId, namespaceId: collection.namespaceId } as any;
  if (ctx.state.user) {
    override.userId = ctx.state.user._id;
  }

  const result = await Permissions.create(ctx.request.body, override, user);

  const populatedResult = await result
    .populate(Permissions.accessControl.options.populate)
    .execPopulate();
  const record = await Permissions.read(populatedResult, user);

  ctx.response.body = { record };
}
