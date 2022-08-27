import { Collection, RecordPermissions, RecordSchema } from '@tenlastic/mongoose-models';
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
  const override = { collectionId, namespaceId: collection.namespaceId } as any;
  if (ctx.state.user) {
    override.userId = ctx.state.user._id;
  }

  const result = await Permissions.create(credentials, override, ctx.request.body);
  const record = await Permissions.read(credentials, result);

  ctx.response.body = { record };
}
