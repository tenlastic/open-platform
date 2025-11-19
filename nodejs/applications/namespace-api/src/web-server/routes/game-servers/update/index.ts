import {
  GameServerDocument,
  GameServerModel,
  GameServerPermissionOptions,
  NamespaceModel,
} from '@tenlastic/mongoose';
import * as permissions from '@tenlastic/mongoose-permissions';
import { RecordNotFoundError, UpdateOneContext } from '@tenlastic/web-server';

export async function handler(ctx: UpdateOneContext<GameServerDocument>) {
  const context = {
    credentials: { ...ctx.state },
    Model: GameServerModel,
    options: GameServerPermissionOptions,
  };
  const existing = await permissions.findOne(context, {}, { where: ctx.params });
  if (!existing) {
    throw new RecordNotFoundError('Record');
  }

  const { cpu, memory, preemptible } = ctx.request.body;
  if (cpu || memory) {
    const namespace = await NamespaceModel.findOne({ _id: ctx.params.namespaceId });
    namespace.checkCpuLimit(cpu, existing.cpu);
    namespace.checkMemoryLimit(memory, existing.memory);
    namespace.checkNonPreemptibleLimit(preemptible ?? existing.preemptible);
  }

  const result = await permissions.updateOne(context, ctx.request.body, ctx.params, existing);
  const record = await permissions.read(context, result);

  ctx.response.body = { record };
}
