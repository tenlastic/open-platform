import { Collection, RecordSchema } from '@tenlastic/mongoose-models';
import { Context, RecordNotFoundError } from '@tenlastic/web-server';

export async function handler(ctx: Context) {
  const { collectionId } = ctx.params;
  const user = ctx.state.apiKey || ctx.state.user;

  const collection = await Collection.findOne({ _id: collectionId });
  if (!collection) {
    throw new RecordNotFoundError('Collection');
  }

  const Model = RecordSchema.getModel(collection);
  const Permissions = RecordSchema.getPermissions(Model, collection);

  const override = { collectionId, namespaceId: collection.namespaceId } as any;
  if (ctx.state.user) {
    override.userId = ctx.state.user._id;
  }

  const result = await Permissions.create(ctx.request.body, override, user);
  const record = await Permissions.read(result, user);

  ctx.response.body = { record };
}
