import { MongoosePermissions } from '@tenlastic/mongoose-permissions';
import * as mongoose from 'mongoose';

import { Context } from '../../context';

export function find<TDocument extends mongoose.Document>(
  Permissions: MongoosePermissions<TDocument>,
) {
  return async function(ctx: Context) {
    const user = ctx.state.apiKey || ctx.state.user;

    const results = await Permissions.find(ctx.request.query, { where: ctx.params }, user);
    const records = await Promise.all(results.map(r => Permissions.read(r, user)));

    ctx.response.body = { records };
  };
}
