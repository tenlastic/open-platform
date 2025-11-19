import * as permissions from '@tenlastic/mongoose-permissions';
import * as mongoose from 'mongoose';

import { RecordNotFoundError } from '../../errors';
import { Context, RecordResponse } from '../../types';

export type FindOneContext<TDocument extends mongoose.Document> = Context<
  mongoose.FilterQuery<TDocument>,
  void,
  RecordResponse<TDocument>
>;

export function findOne<TDocument extends mongoose.Document>(
  Model: mongoose.Model<TDocument>,
  options: permissions.IOptions<TDocument>,
) {
  return async function (ctx: FindOneContext<TDocument>) {
    const context = { credentials: { ...ctx.state }, Model, options };

    const result = await dependencies.findOne(context, {}, { where: ctx.params });
    if (!result) {
      throw new RecordNotFoundError('Record');
    }

    const record = await dependencies.read(context, result);

    ctx.response.body = { record };
  };
}

export const dependencies = { findOne: permissions.findOne, read: permissions.read };
