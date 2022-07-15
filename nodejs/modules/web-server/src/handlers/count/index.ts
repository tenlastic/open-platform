import { MongoosePermissions } from '@tenlastic/mongoose-permissions';
import * as mongoose from 'mongoose';

import { Context } from '../../context';

export function count<TDocument extends mongoose.Document>(
  Permissions: MongoosePermissions<TDocument>,
) {
  return async function (ctx: Context) {
    const credentials = { ...ctx.state };
    const result = await Permissions.count(credentials, ctx.params, ctx.request.query.where);

    ctx.response.body = { count: result };
  };
}
