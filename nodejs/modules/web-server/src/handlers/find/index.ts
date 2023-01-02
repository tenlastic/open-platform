import { MongoosePermissions } from '@tenlastic/mongoose-permissions';
import * as mongoose from 'mongoose';

import { Context } from '../../context';

export function find<TDocument extends mongoose.Document>(
  Permissions: MongoosePermissions<TDocument>,
) {
  return async function (ctx: Context) {
    const credentials = { ...ctx.state };
    const results = await Permissions.find(credentials, { where: ctx.params }, ctx.request.query);
    const records = await Promise.all(results.map((r) => Permissions.read(credentials, r)));

    ctx.response.body = { records };
  };
}
