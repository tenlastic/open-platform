import { Context, RecordNotFoundError } from '@tenlastic/web-server';

import { Namespace, NamespacePermissions } from '../../../models';

export async function handler(ctx: Context) {
  const where = await NamespacePermissions.where({ _id: ctx.params.id }, ctx.state.user);
  const record = await Namespace.findOne(where).populate(
    NamespacePermissions.accessControl.options.populate,
  );

  if (!record) {
    throw new RecordNotFoundError('Namespace');
  }

  const { accessControlList } = record ? record : ctx.request.body;
  const { user } = ctx.state;

  const override = {
    accessControlList: Namespace.getDefaultAccessControlList(accessControlList, user) as any,
  };

  const result = await NamespacePermissions.update(
    record,
    ctx.request.body,
    override,
    ctx.state.user,
  );

  ctx.response.body = { record: result };
}
