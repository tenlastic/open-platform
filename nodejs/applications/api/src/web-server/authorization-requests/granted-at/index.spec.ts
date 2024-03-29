import {
  AuthorizationModel,
  AuthorizationRequestDocument,
  AuthorizationRequestModel,
  AuthorizationRole,
  NamespaceDocument,
  NamespaceModel,
  UserDocument,
  UserModel,
} from '@tenlastic/mongoose';
import { ContextMock, RecordNotFoundError } from '@tenlastic/web-server';
import { expect, use } from 'chai';
import * as chaiAsPromised from 'chai-as-promised';

import { handler } from './';

use(chaiAsPromised);

describe('web-server/authorization-requests/granted-at', function () {
  let otherUser: UserDocument;
  let namespace: NamespaceDocument;
  let user: UserDocument;

  beforeEach(async function () {
    namespace = await NamespaceModel.mock().save();
    otherUser = await UserModel.mock().save();
    user = await UserModel.mock().save();
  });

  context('when permission is granted', function () {
    let record: AuthorizationRequestDocument;

    beforeEach(async function () {
      record = await AuthorizationRequestModel.mock({
        namespaceId: namespace._id,
        userId: user._id,
      }).save();
    });

    it('throws an error', async function () {
      const ctx = new ContextMock({
        params: { _id: record._id, namespaceId: namespace._id },
        state: { user: otherUser.toObject() },
      });

      const promise = handler(ctx as any);

      return expect(promise).to.be.rejectedWith(RecordNotFoundError);
    });
  });

  context('when permission is granted', function () {
    let record: AuthorizationRequestDocument;

    beforeEach(async function () {
      await AuthorizationModel.mock({
        namespaceId: namespace._id,
        roles: [AuthorizationRole.AuthorizationsRead, AuthorizationRole.AuthorizationsWrite],
        userId: user._id,
      }).save();
      record = await AuthorizationRequestModel.mock({
        namespaceId: namespace._id,
        roles: [AuthorizationRole.AuthorizationsRead, AuthorizationRole.AuthorizationsWrite],
        userId: otherUser._id,
      }).save();
    });

    it('updates the record', async function () {
      const ctx = new ContextMock({
        params: { _id: record._id, namespaceId: namespace._id },
        state: { user: user.toObject() },
      });

      await handler(ctx as any);

      expect(ctx.response.body.record.grantedAt).to.exist;
    });
  });
});
