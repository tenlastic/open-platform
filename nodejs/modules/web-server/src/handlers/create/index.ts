import * as permissions from '@tenlastic/mongoose-permissions';
import * as mongoose from 'mongoose';

import { Context, RecordRequest, RecordResponse } from '../../types';

export type CreateContext<TDocument extends mongoose.Document> = Context<
  mongoose.FilterQuery<TDocument>,
  RecordRequest<TDocument>,
  RecordResponse<TDocument>
>;

export function create<TDocument extends mongoose.Document>(
  Model: mongoose.Model<TDocument>,
  options: permissions.IOptions<TDocument>,
) {
  return async function (ctx: CreateContext<TDocument>) {
    const context = { credentials: { ...ctx.state }, Model, options };

    const result = await dependencies.create(context, ctx.request.body, ctx.params);
    const record = await dependencies.read(context, result);

    ctx.response.body = { record };
  };
}

export const dependencies = { create: permissions.create, read: permissions.read };
