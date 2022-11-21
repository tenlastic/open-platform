import { ContextMock, RecordNotFoundError } from '@tenlastic/web-server';
import { expect, use } from 'chai';
import * as chaiAsPromised from 'chai-as-promised';

import {
  Authorization,
  AuthorizationMock,
  AuthorizationRequestDocument,
  AuthorizationRequestMock,
  AuthorizationRole,
  NamespaceDocument,
  NamespaceMock,
  UserDocument,
  UserMock,
} from '../../../mongodb';
import { handler } from './';

use(chaiAsPromised);

describe('web-server/authorization-requests/update', function () {
  let otherUser: UserDocument;
  let namespace: NamespaceDocument;
  let user: UserDocument;

  beforeEach(async function () {
    namespace = await NamespaceMock.create();
    otherUser = await UserMock.create();
    user = await UserMock.create();
  });

  context('when permission is denied', function () {
    let record: AuthorizationRequestDocument;

    beforeEach(async function () {
      record = await AuthorizationRequestMock.create({
        namespaceId: namespace._id,
        userId: user._id,
      });
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
      await AuthorizationMock.create({
        namespaceId: namespace._id,
        roles: [AuthorizationRole.AuthorizationsReadWrite],
        userId: user._id,
      });
      record = await AuthorizationRequestMock.create({
        grantedAt: new Date(),
        namespaceId: namespace._id,
        roles: [AuthorizationRole.AuthorizationsReadWrite],
        userId: otherUser._id,
      });
    });

    it('returns the record', async function () {
      const ctx = new ContextMock({
        params: { _id: record._id, namespaceId: namespace._id },
        request: { body: { roles: [AuthorizationRole.NamespacesReadWrite] } },
        state: { user: user.toObject() },
      });

      await handler(ctx as any);

      expect(ctx.response.body.record.deniedAt).to.not.exist;
      expect(ctx.response.body.record.grantedAt).to.not.exist;
      expect(ctx.response.body.record.roles).to.exist;
    });

    context('when denied and the Authorization exists', function () {
      it('updates the Authorization', async function () {
        await AuthorizationMock.create({
          namespaceId: namespace._id,
          roles: [AuthorizationRole.AuthorizationsReadWrite],
          userId: otherUser._id,
        });
        const ctx = new ContextMock({
          params: { _id: record._id, namespaceId: namespace._id },
          request: { body: { deniedAt: new Date() } },
          state: { user: user.toObject() },
        });

        await handler(ctx as any);

        const authorization = await Authorization.findOne({ userId: otherUser._id });
        expect(authorization).to.exist;
        expect(authorization.roles).to.eql([]);
      });
    });

    context('when granted', function () {
      context('when the Authorization exists', function () {
        it('updates the Authorization', async function () {
          await AuthorizationMock.create({
            namespaceId: namespace._id,
            roles: [AuthorizationRole.NamespacesReadWrite],
            userId: otherUser._id,
          });
          const ctx = new ContextMock({
            params: { _id: record._id, namespaceId: namespace._id },
            request: { body: { grantedAt: new Date() } },
            state: { user: user.toObject() },
          });

          await handler(ctx as any);

          const authorization = await Authorization.findOne({ userId: otherUser._id });
          expect(authorization).to.exist;
          expect(authorization.roles).to.eql([
            AuthorizationRole.AuthorizationsReadWrite,
            AuthorizationRole.NamespacesReadWrite,
          ]);
        });
      });

      context('when the Authorization does not exist', function () {
        it('creates an Authorization', async function () {
          const ctx = new ContextMock({
            params: { _id: record._id, namespaceId: namespace._id },
            request: { body: { grantedAt: new Date() } },
            state: { user: user.toObject() },
          });

          await handler(ctx as any);

          const authorization = await Authorization.findOne({ userId: otherUser._id });
          expect(authorization).to.exist;
          expect(authorization.roles).to.eql(record.roles);
        });
      });
    });
  });
});
