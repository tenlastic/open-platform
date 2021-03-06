import { Workflow, WorkflowPermissions } from '@tenlastic/mongoose-models';
import { Context, RequiredFieldError } from '@tenlastic/web-server';

export async function handler(ctx: Context) {
  const user = ctx.state.apiKey || ctx.state.user;

  await new Workflow(ctx.request.body).validate();

  const { cpu, memory, namespaceId, preemptible, spec, storage } = ctx.request.body;
  if (!cpu || !memory || !namespaceId || !spec || !storage) {
    throw new RequiredFieldError(['cpu', 'memory', 'namespaceId', 'spec', 'storage']);
  }

  await Workflow.checkNamespaceLimits(
    cpu,
    memory,
    namespaceId,
    spec.parallelism,
    preemptible || false,
    storage,
  );

  const result = await WorkflowPermissions.create(ctx.request.body, ctx.params, user);
  const record = await WorkflowPermissions.read(result, user);

  ctx.response.body = { record };
}
