import { MongoosePermissions } from '@tenlastic/mongoose-permissions';
import * as mongoose from 'mongoose';

import { Context } from '../../context';
import { RecordNotFoundError } from '../../errors';

export function findOne<TDocument extends mongoose.Document>(
  Permissions: MongoosePermissions<TDocument>,
) {
  return async function (ctx: Context) {
    const credentials = { ...ctx.state };
    const result = await Permissions.findOne(credentials, { where: ctx.params }, {});
    if (!result) {
      throw new RecordNotFoundError('Record');
    }

    const record = await Permissions.read(credentials, result);
    ctx.response.body = { record };
  };
}
