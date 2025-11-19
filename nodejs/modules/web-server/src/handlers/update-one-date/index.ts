import * as permissions from '@tenlastic/mongoose-permissions';
import * as mongoose from 'mongoose';

import { RecordNotFoundError } from '../../errors';
import { Context, RecordRequest, RecordResponse } from '../../types';

export type UpdateOneDateContext<TDocument extends mongoose.Document> = Context<
  mongoose.FilterQuery<TDocument>,
  RecordRequest<TDocument>,
  RecordResponse<TDocument>
>;

export function updateOneDate<TDocument extends mongoose.Document>(
  key: keyof TDocument & string,
  Model: mongoose.Model<TDocument>,
  options: permissions.IOptions<TDocument>,
) {
  return async function (ctx: UpdateOneDateContext<TDocument>) {
    const context = { credentials: { ...ctx.state }, Model, options };

    const existing = await dependencies.findOne(context, {}, { where: ctx.params });
    if (!existing) {
      throw new RecordNotFoundError('Record');
    }

    const fieldPermissions = await dependencies.getFieldPermissions(context, 'update', existing);
    if (!fieldPermissions.includes(key)) {
      throw new permissions.PermissionError();
    }

    const result = await existing.set(key, new Date()).save();
    const record = await dependencies.read(context, result);

    ctx.response.body = { record };
  };
}

export const dependencies = {
  findOne: permissions.findOne,
  getFieldPermissions: permissions.getFieldPermissions,
  read: permissions.read,
};
