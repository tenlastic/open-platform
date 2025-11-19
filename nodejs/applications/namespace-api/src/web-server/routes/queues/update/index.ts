import {
  NamespaceModel,
  QueueDocument,
  QueueModel,
  QueuePermissionOptions,
} from '@tenlastic/mongoose';
import * as permissions from '@tenlastic/mongoose-permissions';
import { RecordNotFoundError, UpdateOneContext } from '@tenlastic/web-server';

export async function handler(ctx: UpdateOneContext<QueueDocument>) {
  const context = {
    credentials: { ...ctx.state },
    Model: QueueModel,
    options: QueuePermissionOptions,
  };
  const existing = await permissions.findOne(context, { where: ctx.params }, {});
  if (!existing) {
    throw new RecordNotFoundError('Record');
  }

  const { cpu, memory, preemptible, replicas } = ctx.request.body;
  if (cpu || memory || replicas) {
    const namespace = await NamespaceModel.findOne({ _id: ctx.params.namespaceId });
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

  const result = await permissions.updateOne(context, ctx.request.body, ctx.params, existing);
  const record = await permissions.read(context, result);

  ctx.response.body = { record };
}
