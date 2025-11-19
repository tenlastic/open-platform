import * as permissions from '@tenlastic/mongoose-permissions';
import * as mongoose from 'mongoose';

import { Context, FindRequest, RecordsResponse } from '../../types';

export type FindContext<TDocument extends mongoose.Document> = Context<
  mongoose.FilterQuery<TDocument>,
  FindRequest<TDocument>,
  RecordsResponse<TDocument>
>;

export function find<TDocument extends mongoose.Document>(
  Model: mongoose.Model<TDocument>,
  options: permissions.IOptions<TDocument>,
) {
  return async function (ctx: FindContext<TDocument>) {
    const context = { credentials: { ...ctx.state }, Model, options };

    const results = await dependencies.find(context, ctx.request.query, { where: ctx.params });
    const records = await Promise.all(results.map((r) => dependencies.read(context, r)));

    ctx.response.body = { records };
  };
}

export const dependencies = { find: permissions.find, read: permissions.read };
