import { podApiV1 } from '@tenlastic/kubernetes';
import { GameServerPermissions } from '@tenlastic/mongoose-models';
import { PermissionError } from '@tenlastic/mongoose-permissions';
import { Context, RecordNotFoundError } from '@tenlastic/web-server';

export async function handler(ctx: Context) {
  // Check if the user can access the record.
  const credentials = { ...ctx.state };
  const override = { where: { _id: ctx.params._id } };
  const gameServer = await GameServerPermissions.findOne(credentials, override, {});
  if (!gameServer) {
    throw new RecordNotFoundError('Record');
  }

  // Check if the record contains the requested node.
  const node = gameServer.status?.nodes?.find((n) => n._id === ctx.params.nodeId);
  if (!node) {
    throw new RecordNotFoundError('Record');
  }

  // Check if the user can access the record's logs.
  const permissions = await GameServerPermissions.getFieldPermissions(
    credentials,
    'read',
    gameServer,
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
  } catch {
    throw new RecordNotFoundError('Record');
  }
}
