import { Context, RequiredFieldError } from '@tenlastic/web-server';

import { Namespace, WorkflowPermissions } from '../../../../mongodb';

export async function handler(ctx: Context) {
  const { cpu, memory, preemptible } = ctx.request.body;
  if (!cpu || !memory) {
    throw new RequiredFieldError(['cpu', 'memory']);
  }

  const namespace = await Namespace.findOne({ _id: ctx.params.namespaceId });
  namespace.checkCpuLimit(cpu);
  namespace.checkMemoryLimit(memory);
  namespace.checkPreemptibleLimit(preemptible);

  const credentials = { ...ctx.state };
  const result = await WorkflowPermissions.create(credentials, ctx.params, ctx.request.body);
  const record = await WorkflowPermissions.read(credentials, result);

  ctx.response.body = { record };
}
