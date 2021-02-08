import { Workflow, WorkflowPermissions } from '@tenlastic/mongoose-models';
import { Context } from 'koa';

export async function handler(ctx: Context) {
  const user = ctx.state.apiKey || ctx.state.user;

  await new Workflow(ctx.request.body).validate();

  const { isPreemptible, namespaceId, spec } = ctx.request.body;
  const { parallelism, templates } = spec;

  await Workflow.checkNamespaceLimits(isPreemptible || false, namespaceId, parallelism, templates);

  const result = await WorkflowPermissions.create(ctx.request.body, ctx.params, user);
  const record = await WorkflowPermissions.read(result, user);

  ctx.response.body = { record };
}
