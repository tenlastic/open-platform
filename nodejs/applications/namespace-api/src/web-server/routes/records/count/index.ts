import {
  CollectionModel,
  getRecordModel,
  getRecordPermissionOptions,
  RecordDocument,
} from '@tenlastic/mongoose';
import * as permissions from '@tenlastic/mongoose-permissions';
import { CountContext, RecordNotFoundError } from '@tenlastic/web-server';

export async function handler(ctx: CountContext<RecordDocument>) {
  const { collectionId } = ctx.params;

  const collection = await CollectionModel.findOne({ _id: collectionId });
  if (!collection) {
    throw new RecordNotFoundError('Collection');
  }

  const Model = getRecordModel(collection);
  const options = getRecordPermissionOptions(collection);

  const context = { credentials: { ...ctx.state }, Model, options };
  const result = await permissions.count(context, ctx.request.query.where, { collectionId });

  ctx.response.body = { count: result };
}
