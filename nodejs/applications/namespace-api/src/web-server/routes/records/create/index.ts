import {
  CollectionModel,
  getRecordModel,
  getRecordPermissionOptions,
  RecordDocument,
} from '@tenlastic/mongoose';
import * as permissions from '@tenlastic/mongoose-permissions';
import { CreateContext, RecordNotFoundError } from '@tenlastic/web-server';
import * as mongoose from 'mongoose';

export async function handler(ctx: CreateContext<RecordDocument>) {
  const { collectionId } = ctx.params;

  const collection = await CollectionModel.findOne({ _id: collectionId });
  if (!collection) {
    throw new RecordNotFoundError('Collection');
  }

  const Model = getRecordModel(collection);
  const options = getRecordPermissionOptions(collection);

  const context = { credentials: { ...ctx.state }, Model, options };
  const overlayParameters: Partial<RecordDocument> = {
    collectionId,
    namespaceId: collection.namespaceId,
  };
  if (ctx.state.user) {
    overlayParameters.userId = new mongoose.Types.ObjectId(ctx.state.user._id);
  }

  const result = await permissions.create(context, ctx.request.body, overlayParameters);
  const record = await permissions.read(context, result);

  ctx.response.body = { record };
}
