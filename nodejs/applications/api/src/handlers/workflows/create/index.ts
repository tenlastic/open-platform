import { Workflow, WorkflowPermissions } from '@tenlastic/mongoose-models';
import { Context, RequiredFieldError } from '@tenlastic/web-server';

export async function handler(ctx: Context) {
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

  const credentials = { ...ctx.state };
  const result = await WorkflowPermissions.create(credentials, ctx.params, ctx.request.body);
  const record = await WorkflowPermissions.read(credentials, result);

  ctx.response.body = { record };
}
