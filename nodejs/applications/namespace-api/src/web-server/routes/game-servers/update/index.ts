import { GameServerPermissions, Namespace } from '@tenlastic/mongoose';
import { Context, RecordNotFoundError } from '@tenlastic/web-server';

export async function handler(ctx: Context) {
  const credentials = { ...ctx.state };
  const existing = await GameServerPermissions.findOne(credentials, { where: ctx.params }, {});
  if (!existing) {
    throw new RecordNotFoundError('Record');
  }

  const { cpu, memory, preemptible } = ctx.request.body;
  if (cpu || memory) {
    const namespace = await Namespace.findOne({ _id: ctx.params.namespaceId });
    namespace.checkCpuLimit(cpu, existing.cpu);
    namespace.checkMemoryLimit(memory, existing.memory);
    namespace.checkNonPreemptibleLimit(preemptible ?? existing.preemptible);
  }

  const result = await GameServerPermissions.update(
    credentials,
    ctx.params,
    ctx.request.body,
    existing,
  );
  const record = await GameServerPermissions.read(credentials, result);

  ctx.response.body = { record };
}
