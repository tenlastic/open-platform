import { GameServerTemplateModel, MatchPermissions, NamespaceModel } from '@tenlastic/mongoose';
import { Context, RecordNotFoundError, RequiredFieldError } from '@tenlastic/web-server';

export async function handler(ctx: Context) {
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

  const credentials = { ...ctx.state };
  const result = await MatchPermissions.create(credentials, ctx.params, ctx.request.body);
  const record = await MatchPermissions.read(credentials, result);

  ctx.response.body = { record };
}
