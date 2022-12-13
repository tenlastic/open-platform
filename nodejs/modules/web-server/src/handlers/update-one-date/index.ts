import { MongoosePermissions, PermissionError } from '@tenlastic/mongoose-permissions';
import * as mongoose from 'mongoose';

import { Context } from '../../context';
import { RecordNotFoundError } from '../../errors';

export function updateOneDate<TDocument extends mongoose.Document>(
  key: keyof TDocument & string,
  Permissions: MongoosePermissions<TDocument>,
) {
  return async function (ctx: Context) {
    const credentials = { ...ctx.state };
    const existing = await Permissions.findOne(credentials, { where: ctx.params }, {});
    if (!existing) {
      throw new RecordNotFoundError('Record');
    }

    const permissions = await Permissions.getFieldPermissions(credentials, 'update', existing);
    if (!permissions.includes(key)) {
      throw new PermissionError();
    }

    const result = await existing.set(key, new Date()).save();
    const record = await Permissions.read(credentials, result);

    ctx.response.body = { record };
  };
}
