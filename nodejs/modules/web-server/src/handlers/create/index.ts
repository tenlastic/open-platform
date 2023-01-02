import { MongoosePermissions } from '@tenlastic/mongoose-permissions';
import * as mongoose from 'mongoose';

import { Context } from '../../context';

export function create<TDocument extends mongoose.Document>(
  Permissions: MongoosePermissions<TDocument>,
) {
  return async function (ctx: Context) {
    const credentials = { ...ctx.state };
    const result = await Permissions.create(credentials, ctx.params, ctx.request.body);
    const record = await Permissions.read(credentials, result);

    ctx.response.body = { record };
  };
}
