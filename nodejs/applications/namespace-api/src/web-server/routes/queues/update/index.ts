import { Namespace, QueuePermissions } from '@tenlastic/mongoose';
import { Context, RecordNotFoundError } from '@tenlastic/web-server';

export async function handler(ctx: Context) {
  const credentials = { ...ctx.state };
  const existing = await QueuePermissions.findOne(credentials, { where: ctx.params }, {});
  if (!existing) {
    throw new RecordNotFoundError('Record');
  }

  const { cpu, memory, preemptible, replicas } = ctx.request.body;
  if (cpu || memory || replicas) {
    const namespace = await Namespace.findOne({ _id: ctx.params.namespaceId });
    namespace.checkCpuLimit(
      cpu * (replicas ?? existing.replicas),
      existing.cpu * existing.replicas,
    );
    namespace.checkMemoryLimit(
      memory * (replicas ?? existing.replicas),
      existing.memory * existing.replicas,
    );
    namespace.checkNonPreemptibleLimit(preemptible ?? existing.preemptible);
  }

  const result = await QueuePermissions.update(credentials, ctx.params, ctx.request.body, existing);
  const record = await QueuePermissions.read(credentials, result);

  ctx.response.body = { record };
}
