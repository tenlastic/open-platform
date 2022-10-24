import { podApiV1 } from '@tenlastic/kubernetes';
import { MongoosePermissions, PermissionError } from '@tenlastic/mongoose-permissions';
import * as mongoose from 'mongoose';

import { Context } from '../../context';
import { RecordNotFoundError } from '../../errors';

interface Record {
  status: Status;
}
interface Node {
  container: string;
  pod: string;
}
interface Status {
  nodes: Node[];
}

export function logs<TDocument extends mongoose.Document & Record>(
  Permissions: MongoosePermissions<TDocument>,
) {
  return async function (ctx: Context) {
    // Check if the user can access the record.
    const credentials = { ...ctx.state };
    const override = { where: { _id: ctx.params._id } };
    const record = await Permissions.findOne(credentials, override, {});
    if (!record) {
      throw new RecordNotFoundError('Record');
    }

    // Check if the record contains the requested node.
    const node = record.status?.nodes?.find(
      (n) => n.container === ctx.params.container && n.pod === ctx.params.pod,
    );
    if (!node) {
      throw new RecordNotFoundError('Record');
    }

    // Check if the user can access the record's logs.
    const permissions = await Permissions.getFieldPermissions(credentials, 'read', record);
    if (!permissions.includes('logs')) {
      throw new PermissionError();
    }

    try {
      const options = { since: ctx.request.query.since, tail: ctx.request.query.tail };
      const records = await podApiV1.readNamespacedPodLog(
        node.pod,
        'dynamic',
        node.container,
        options,
      );
      ctx.response.body = { records };
    } catch {
      throw new RecordNotFoundError('Record');
    }
  };
}
