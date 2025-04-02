import {
  AuthorizationModel,
  AuthorizationRole,
  NamespaceDocument,
  NamespaceModel,
  UserDocument,
  UserModel,
} from '@tenlastic/mongoose';
import { ContextMock } from '@tenlastic/web-server';
import { expect, use } from 'chai';
import * as chaiAsPromised from 'chai-as-promised';

import { handler } from './';

use(chaiAsPromised);

describe('web-server/groups/create', function () {
  let user: UserDocument;

  beforeEach(async function () {
    user = await UserModel.mock().save();
  });

  context('when permission is granted', function () {
    let ctx: ContextMock;
    let namespace: NamespaceDocument;

    beforeEach(async function () {
      namespace = await NamespaceModel.mock().save();
      await AuthorizationModel.mock({
        namespaceId: namespace._id,
        roles: [AuthorizationRole.GroupsPlay],
        userId: user._id,
      }).save();

      ctx = new ContextMock({ params: { namespaceId: namespace._id }, state: { user } } as any);
    });

    it('creates a Group', async function () {
      await handler(ctx as any);

      expect(ctx.response.body.record).to.exist;
    });
  });
});
