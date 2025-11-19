import {
  GameServerDocument,
  GameServerModel,
  GameServerPermissionOptions,
  NamespaceModel,
} from '@tenlastic/mongoose';
import * as permissions from '@tenlastic/mongoose-permissions';
import { CreateContext, RequiredFieldError } from '@tenlastic/web-server';

export async function handler(ctx: CreateContext<GameServerDocument>) {
  const { cpu, memory, preemptible } = ctx.request.body;
  if (!cpu || !memory) {
    throw new RequiredFieldError(['cpu', 'memory']);
  }

  const namespace = await NamespaceModel.findOne({ _id: ctx.params.namespaceId });
  namespace.checkCpuLimit(cpu);
  namespace.checkMemoryLimit(memory);
  namespace.checkNonPreemptibleLimit(preemptible);

  const context = {
    credentials: { ...ctx.state },
    Model: GameServerModel,
    options: GameServerPermissionOptions,
  };
  const result = await permissions.create(context, ctx.request.body, ctx.params);
  const record = await permissions.read(context, result);

  ctx.response.body = { record };
}
