import { Collection, NamespaceLimitError, RecordSchema } from '@tenlastic/mongoose-models';
import { Context, RecordNotFoundError } from '@tenlastic/web-server';

export async function handler(ctx: Context) {
  const { _id, collectionId } = ctx.params;
  const user = ctx.state.apiKey || ctx.state.user;

  const collection = await Collection.findOne({ _id: collectionId }).populate('namespaceDocument');
  if (!collection) {
    throw new RecordNotFoundError('Collection');
  }

  const Model = RecordSchema.getModel(collection);
  const Permissions = RecordSchema.getPermissions(Model, collection);

  const limits = collection.namespaceDocument.limits.collections;
  if (limits.size > 0) {
    const stats = await Model.collection.stats();

    if (stats.size >= limits.size) {
      throw new NamespaceLimitError('collections.size', limits.size);
    }
  }

  const existing = await Permissions.findOne({}, { where: { _id, collectionId } }, user);
  if (!existing) {
    throw new RecordNotFoundError('Record');
  }

  const result = await Permissions.update(existing, ctx.request.body, {}, user, ['properties']);
  const record = await Permissions.read(result, user);

  ctx.response.body = { record };
}
