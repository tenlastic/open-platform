import {
  AuthorizationModel,
  AuthorizationRole,
  GroupDocument,
  NamespaceDocument,
  NamespaceModel,
  UserDocument,
  UserModel,
} from '@tenlastic/mongoose';
import { ContextMock, CreateContext } from '@tenlastic/web-server';
import { expect, use } from 'chai';
import chaiAsPromised from 'chai-as-promised';

import { handler } from './';

use(chaiAsPromised);

describe('web-server/groups/create', function () {
  let user: UserDocument;

  beforeEach(async function () {
    user = await UserModel.mock().save();
  });

  context('when permission is granted', function () {
    let ctx: CreateContext<GroupDocument>;
    let namespace: NamespaceDocument;

    beforeEach(async function () {
      namespace = await NamespaceModel.mock().save();
      await AuthorizationModel.mock({
        namespaceId: namespace._id,
        roles: [AuthorizationRole.GroupsPlay],
        userId: user._id,
      }).save();

      ctx = ContextMock({
        params: { namespaceId: namespace._id },
        state: { user: { _id: user._id.toHexString() } },
      });
    });

    it('creates a Group', async function () {
      await handler(ctx);

      expect(ctx.response.body.record).to.exist;
    });
  });
});
