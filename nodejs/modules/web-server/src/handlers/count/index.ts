import * as permissions from '@tenlastic/mongoose-permissions';
import * as mongoose from 'mongoose';

import { Context, CountRequest, CountResponse } from '../../types';

export type CountContext<TDocument extends mongoose.Document> = Context<
  mongoose.FilterQuery<TDocument>,
  CountRequest<TDocument>,
  CountResponse
>;

export function count<TDocument extends mongoose.Document>(
  Model: mongoose.Model<TDocument>,
  options: permissions.IOptions<TDocument>,
) {
  return async function (ctx: CountContext<TDocument>) {
    const context = { credentials: { ...ctx.state }, Model, options };
    const result = await dependencies.count<TDocument>(
      context,
      ctx.request.query.where,
      ctx.params,
    );

    ctx.response.body = { count: result };
  };
}

export const dependencies = { count: permissions.count };
