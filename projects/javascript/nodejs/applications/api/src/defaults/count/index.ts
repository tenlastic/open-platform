import { MongoosePermissions } from '@tenlastic/mongoose-permissions';
import { Context } from '@tenlastic/web-server';
import * as mongoose from 'mongoose';

export function count<TDocument extends mongoose.Document>(
  Permissions: MongoosePermissions<TDocument>,
) {
  return async function(ctx: Context) {
    const user = ctx.state.apiKey || ctx.state.user;

    const result = await Permissions.count(ctx.request.query.where, ctx.params, user);

    ctx.response.body = { count: result };
  };
}
