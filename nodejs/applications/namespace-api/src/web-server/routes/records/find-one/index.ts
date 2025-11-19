import {
  CollectionModel,
  getRecordModel,
  getRecordPermissionOptions,
  RecordDocument,
} from '@tenlastic/mongoose';
import * as permissions from '@tenlastic/mongoose-permissions';
import { FindOneContext, RecordNotFoundError } from '@tenlastic/web-server';

export async function handler(ctx: FindOneContext<RecordDocument>) {
  const { _id, collectionId } = ctx.params;

  const collection = await CollectionModel.findOne({ _id: collectionId });
  if (!collection) {
    throw new RecordNotFoundError('Collection');
  }

  const Model = getRecordModel(collection);
  const options = getRecordPermissionOptions(collection);

  const context = { credentials: { ...ctx.state }, Model, options };
  const result = await permissions.findOne(context, {}, { where: { _id, collectionId } });
  if (!result) {
    throw new RecordNotFoundError('Record');
  }

  const record = await permissions.read(context, result);

  ctx.response.body = { record };
}
