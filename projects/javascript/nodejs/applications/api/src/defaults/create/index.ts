import { MongoosePermissions } from '@tenlastic/mongoose-permissions';
import { Context } from '@tenlastic/web-server';
import * as mongoose from 'mongoose';

export function create<TDocument extends mongoose.Document>(
  Permissions: MongoosePermissions<TDocument>,
) {
  return async function(ctx: Context) {
    const user = ctx.state.apiKey || ctx.state.user;

    const result = await Permissions.create(ctx.request.body, ctx.params, user);
    const record = await Permissions.read(result, user);

    ctx.response.body = { record };
  };
}
