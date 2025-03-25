import {
  AuthorizationModel,
  AuthorizationRole,
  GroupMemberModel,
  GroupModel,
  NamespaceDocument,
  NamespaceModel,
  UserDocument,
  UserModel,
} from '@tenlastic/mongoose';
import { PermissionError } from '@tenlastic/mongoose-permissions';
import { ContextMock } from '@tenlastic/web-server';
import { expect, use } from 'chai';
import * as chaiAsPromised from 'chai-as-promised';

import { handler } from './';

use(chaiAsPromised);

describe('web-server/group-invitations/create', function () {
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
        roles: [AuthorizationRole.GroupsPlay, AuthorizationRole.GroupsPlay],
        userId: user._id,
      }).save();
      const group = await GroupModel.mock({
        members: [GroupMemberModel.mock({ userId: user._id })],
        namespaceId: namespace._id,
      }).save();

      ctx = new ContextMock({
        params: { namespaceId: namespace._id },
        request: {
          body: {
            groupId: group._id,
            toUserId: user._id,
          },
        },
        state: { user },
      } as any);
    });

    it('creates a Group Invitation', async function () {
      await handler(ctx as any);

      expect(ctx.response.body.record).to.exist;
    });
  });

  context('when permission is denied', function () {
    let ctx: ContextMock;
    let namespace: NamespaceDocument;

    beforeEach(async function () {
      namespace = await NamespaceModel.mock().save();
      await AuthorizationModel.mock({
        namespaceId: namespace._id,
        roles: [AuthorizationRole.GroupsPlay, AuthorizationRole.GroupsPlay],
        userId: user._id,
      }).save();
      const group = await GroupModel.mock({ namespaceId: namespace._id }).save();

      ctx = new ContextMock({
        params: { namespaceId: namespace._id },
        request: {
          body: {
            groupId: group._id,
            toUserId: user._id,
          },
        },
        state: { user },
      } as any);
    });

    it('throws an error', async function () {
      const promise = handler(ctx as any);

      return expect(promise).to.be.rejectedWith(PermissionError);
    });
  });
});
