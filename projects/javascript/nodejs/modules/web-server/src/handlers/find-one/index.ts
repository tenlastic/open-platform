import { MongoosePermissions } from '@tenlastic/mongoose-permissions';
import * as mongoose from 'mongoose';

import { Context } from '../../context';
import { RecordNotFoundError } from '../../errors';

export function findOne<TDocument extends mongoose.Document>(
  Permissions: MongoosePermissions<TDocument>,
) {
  return async function(ctx: Context) {
    const user = ctx.state.apiKey || ctx.state.user;

    const result = await Permissions.findOne({}, { where: ctx.params }, user);
    if (!result) {
      throw new RecordNotFoundError('Record');
    }

    const record = await Permissions.read(result, user);

    ctx.response.body = { record };
  };
}
