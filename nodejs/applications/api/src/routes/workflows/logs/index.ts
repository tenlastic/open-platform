import { podApiV1 } from '@tenlastic/kubernetes';
import { WorkflowPermissions } from '@tenlastic/mongoose-models';
import { PermissionError } from '@tenlastic/mongoose-permissions';
import { Context, RecordNotFoundError } from '@tenlastic/web-server';

export async function handler(ctx: Context) {
  const user = ctx.state.apiKey || ctx.state.user;

  // Check if the user can access the record.
  const override = { where: { _id: ctx.params._id } };
  const workflow = await WorkflowPermissions.findOne({}, override, user);
  if (!workflow) {
    throw new RecordNotFoundError('Record');
  }

  // Check if the record contains the requested node.
  const node = workflow.status?.nodes?.find(n => n._id === ctx.params.nodeId);
  if (!node) {
    throw new RecordNotFoundError('Record');
  }

  // Check if the user can access the record's logs.
  const permissions = WorkflowPermissions.accessControl.getFieldPermissions('read', workflow, user);
  if (!permissions.includes('logs')) {
    throw new PermissionError();
  }

  try {
    const options = { since: ctx.request.query.since, tail: ctx.request.query.tail };
    const records = await podApiV1.readNamespacedPodLog(node._id, 'dynamic', 'main', options);
    ctx.response.body = { records };
  } catch {
    throw new RecordNotFoundError('Record');
  }
}
