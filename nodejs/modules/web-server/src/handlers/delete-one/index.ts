import { MongoosePermissions } from '@tenlastic/mongoose-permissions';
import * as mongoose from 'mongoose';

import { Context } from '../../context';
import { RecordNotFoundError } from '../../errors';

export function deleteOne<TDocument extends mongoose.Document>(
  Permissions: MongoosePermissions<TDocument>,
) {
  return async function (ctx: Context) {
    const credentials = { ...ctx.state };
    const existing = await Permissions.findOne(credentials, { where: ctx.params }, {});
    if (!existing) {
      throw new RecordNotFoundError('Record');
    }

    const result = await Permissions.delete(credentials, existing);
    const record = await Permissions.read(credentials, result);

    ctx.response.body = { record };
  };
}
