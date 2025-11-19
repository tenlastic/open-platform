import {
  GameServerTemplateModel,
  MatchDocument,
  MatchModel,
  MatchPermissionOptions,
  NamespaceModel,
} from '@tenlastic/mongoose';
import * as permissions from '@tenlastic/mongoose-permissions';
import { CreateContext, RecordNotFoundError, RequiredFieldError } from '@tenlastic/web-server';

export async function handler(ctx: CreateContext<MatchDocument>) {
  const { gameServerTemplateId } = ctx.request.body;
  if (!gameServerTemplateId) {
    throw new RequiredFieldError(['gameServerTemplateId']);
  }

  const gameServerTemplate = await GameServerTemplateModel.findOne({ _id: gameServerTemplateId });
  if (!gameServerTemplate) {
    throw new RecordNotFoundError('Record');
  }

  const namespace = await NamespaceModel.findOne({ _id: ctx.params.namespaceId });
  namespace.checkCpuLimit(gameServerTemplate.cpu);
  namespace.checkMemoryLimit(gameServerTemplate.memory);
  namespace.checkNonPreemptibleLimit(gameServerTemplate.preemptible);

  const context = {
    credentials: { ...ctx.state },
    Model: MatchModel,
    options: MatchPermissionOptions,
  };
  const result = await permissions.create(context, ctx.request.body, ctx.params);
  const record = await permissions.read(context, result);

  ctx.response.body = { record };
}
