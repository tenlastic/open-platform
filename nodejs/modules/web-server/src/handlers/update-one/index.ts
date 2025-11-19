import * as permissions from '@tenlastic/mongoose-permissions';
import * as mongoose from 'mongoose';

import { RecordNotFoundError } from '../../errors';
import { Context, RecordRequest, RecordResponse } from '../../types';

export type UpdateOneContext<TDocument extends mongoose.Document> = Context<
  mongoose.FilterQuery<TDocument>,
  RecordRequest<TDocument>,
  RecordResponse<TDocument>
>;

export function updateOne<TDocument extends mongoose.Document>(
  Model: mongoose.Model<TDocument>,
  options: permissions.IOptions<TDocument>,
) {
  return async function (ctx: UpdateOneContext<TDocument>) {
    const context = { credentials: { ...ctx.state }, Model, options };

    const existing = await dependencies.findOne(context, {}, { where: ctx.params });
    if (!existing) {
      throw new RecordNotFoundError('Record');
    }

    const result = await dependencies.updateOne(context, ctx.request.body, ctx.params, existing);
    const record = await dependencies.read(context, result);

    ctx.response.body = { record };
  };
}

export const dependencies = {
  findOne: permissions.findOne,
  read: permissions.read,
  updateOne: permissions.updateOne,
};
