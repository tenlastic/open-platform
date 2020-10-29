import {
  Collection,
  NamespaceLimitError,
  RecordDocument,
  RecordSchema,
} from '@tenlastic/mongoose-models';
import { MongoosePermissions } from '@tenlastic/mongoose-permissions';
import { Context, RecordNotFoundError } from '@tenlastic/web-server';

export async function handler(ctx: Context) {
  const { collectionId } = ctx.params;
  const user = ctx.state.apiKey || ctx.state.user;

  const collection = await Collection.findOne({ _id: collectionId }).populate('namespaceDocument');
  if (!collection) {
    throw new RecordNotFoundError('Collection');
  }

  const Model = RecordSchema.getModelForClass(collection);
  const Permissions = new MongoosePermissions<RecordDocument>(Model, collection.permissions);

  if (collection.namespaceDocument.limits.collections.size > 0) {
    const stats = await Model.collection.stats();

    if (stats.size >= collection.namespaceDocument.limits.collections.size) {
      throw new NamespaceLimitError('collections.size');
    }
  }

  const override = { collectionId: collection._id } as any;
  if (ctx.state.user) {
    override.userId = ctx.state.user._id;
  }

  const result = await Permissions.create(ctx.request.body, override, user);
  const record = await Permissions.read(result, user);

  ctx.response.body = { record };
}
