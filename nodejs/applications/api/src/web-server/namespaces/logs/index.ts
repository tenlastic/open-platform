import { podApiV1 } from '@tenlastic/kubernetes';
import { PermissionError } from '@tenlastic/mongoose-permissions';
import { Context, RecordNotFoundError } from '@tenlastic/web-server';

import { NamespacePermissions } from '../../../mongodb';

export async function handler(ctx: Context) {
  // Check if the user can access the record.
  const credentials = { ...ctx.state };
  const override = { where: { _id: ctx.params._id } };
  const namespace = await NamespacePermissions.findOne(credentials, override, {});
  if (!namespace) {
    throw new RecordNotFoundError('Record');
  }

  // Check if the record contains the requested node.
  const node = namespace.status?.nodes?.find((n) => n._id === ctx.params.nodeId);
  if (!node) {
    throw new RecordNotFoundError('Record');
  }

  // Check if the user can access the record's logs.
  const permissions = await NamespacePermissions.getFieldPermissions(
    credentials,
    'read',
    namespace,
  );
  if (!permissions.includes('logs')) {
    throw new PermissionError();
  }

  try {
    const pod = await podApiV1.read(node._id, 'dynamic');

    const options = { since: ctx.request.query.since, tail: ctx.request.query.tail };
    const records = await podApiV1.readNamespacedPodLog(
      node._id,
      'dynamic',
      pod.body.spec.containers[0].name,
      options,
    );

    ctx.response.body = { records };
  } catch (e) {
    console.error(e);
    throw new RecordNotFoundError('Record');
  }
}
