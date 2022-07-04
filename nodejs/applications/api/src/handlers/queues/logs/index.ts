import { podApiV1 } from '@tenlastic/kubernetes';
import { QueuePermissions } from '@tenlastic/mongoose-models';
import { PermissionError } from '@tenlastic/mongoose-permissions';
import { Context, RecordNotFoundError } from '@tenlastic/web-server';

export async function handler(ctx: Context) {
  const user = ctx.state.apiKey || ctx.state.user;

  // Check if the user can access the record.
  const override = { where: { _id: ctx.params._id } };
  const queue = await QueuePermissions.findOne({}, override, user);
  if (!queue) {
    throw new RecordNotFoundError('Record');
  }

  // Check if the record contains the requested node.
  const node = queue.status?.nodes?.find((n) => n._id === ctx.params.nodeId);
  if (!node) {
    throw new RecordNotFoundError('Record');
  }

  // Check if the user can access the record's logs.
  const permissions = await QueuePermissions.getFieldPermissions('read', queue, user);
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
