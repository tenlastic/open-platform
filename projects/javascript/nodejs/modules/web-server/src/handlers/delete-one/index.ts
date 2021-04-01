import { MongoosePermissions } from '@tenlastic/mongoose-permissions';
import * as mongoose from 'mongoose';

import { Context } from '../../context';
import { RecordNotFoundError } from '../../errors';

export function deleteOne<TDocument extends mongoose.Document>(
  Permissions: MongoosePermissions<TDocument>,
) {
  return async function(ctx: Context) {
    const user = ctx.state.apiKey || ctx.state.user;

    const existing = await Permissions.findOne({}, { where: ctx.params }, user);
    if (!existing) {
      throw new RecordNotFoundError('Record');
    }

    const result = await Permissions.delete(existing, user);
    const record = await Permissions.read(result, user);

    ctx.response.body = { record };
  };
}
