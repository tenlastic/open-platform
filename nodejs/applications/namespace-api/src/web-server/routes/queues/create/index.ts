import { RequiredFieldError } from '@tenlastic/web-server';
import { Context } from 'koa';

import { Namespace, QueuePermissions } from '../../../../mongodb';

export async function handler(ctx: Context) {
  const { cpu, memory, preemptible, replicas } = ctx.request.body;
  if (!cpu || !memory || !replicas) {
    throw new RequiredFieldError(['cpu', 'memory', 'replicas']);
  }

  const namespace = await Namespace.findOne({ _id: ctx.params.namespaceId });
  namespace.checkCpuLimit(cpu * replicas);
  namespace.checkMemoryLimit(memory * replicas);
  namespace.checkPreemptibleLimit(preemptible);

  const credentials = { ...ctx.state };
  const result = await QueuePermissions.create(credentials, ctx.params, ctx.request.body);
  const record = await QueuePermissions.read(credentials, result);

  ctx.response.body = { record };
}
