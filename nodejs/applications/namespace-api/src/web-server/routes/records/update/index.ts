import {
  CollectionModel,
  getRecordModel,
  getRecordPermissionOptions,
  RecordDocument,
} from '@tenlastic/mongoose';
import * as permissions from '@tenlastic/mongoose-permissions';
import { RecordNotFoundError, UpdateOneContext } from '@tenlastic/web-server';

export async function handler(ctx: UpdateOneContext<RecordDocument>) {
  const { _id, collectionId } = ctx.params;

  const collection = await CollectionModel.findOne({ _id: collectionId });
  if (!collection) {
    throw new RecordNotFoundError('Collection');
  }

  const Model = getRecordModel(collection);
  const options = getRecordPermissionOptions(collection);

  const context = { credentials: { ...ctx.state }, Model, options };
  const existing = await permissions.findOne(context, {}, { where: { _id, collectionId } });
  if (!existing) {
    throw new RecordNotFoundError('Record');
  }

  const result = await permissions.updateOne(context, ctx.request.body, ctx.params, existing);
  const record = await permissions.read(context, result);

  ctx.response.body = { record };
}
