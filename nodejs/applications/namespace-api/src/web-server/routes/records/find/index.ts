import {
  CollectionModel,
  getRecordModel,
  getRecordPermissionOptions,
  RecordDocument,
} from '@tenlastic/mongoose';
import * as permissions from '@tenlastic/mongoose-permissions';
import { FindContext, RecordNotFoundError } from '@tenlastic/web-server';

export async function handler(ctx: FindContext<RecordDocument>) {
  const { collectionId } = ctx.params;

  const collection = await CollectionModel.findOne({ _id: collectionId });
  if (!collection) {
    throw new RecordNotFoundError('Collection');
  }

  const Model = getRecordModel(collection);
  const options = getRecordPermissionOptions(collection);

  const context = { credentials: { ...ctx.state }, Model, options };
  const results = await permissions.find(context, ctx.request.query, { where: { collectionId } });
  const records = await Promise.all(results.map((r) => permissions.read(context, r)));

  ctx.response.body = { records };
}
