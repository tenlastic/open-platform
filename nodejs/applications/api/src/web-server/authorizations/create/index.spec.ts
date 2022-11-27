import { AuthorizationRole, NamespaceLimits, NamespaceLimitError } from '@tenlastic/mongoose';
import { PermissionError } from '@tenlastic/mongoose-permissions';
import { ContextMock } from '@tenlastic/web-server';
import { expect, use } from 'chai';
import * as chaiAsPromised from 'chai-as-promised';

import { Authorization, Namespace, NamespaceDocument, User, UserDocument } from '../../../mongodb';
import { handler } from './';

use(chaiAsPromised);

describe('web-server/authorizations/create', function () {
  let otherUser: UserDocument;
  let user: UserDocument;

  beforeEach(async function () {
    otherUser = await User.mock();
    user = await User.mock();
  });

  context('when permission is granted', function () {
    let namespace: NamespaceDocument;

    beforeEach(async function () {
      namespace = await Namespace.mock({
        limits: NamespaceLimits.mock({ defaultAuthorization: true }),
      });
      await Authorization.mock({
        namespaceId: namespace._id,
        roles: [AuthorizationRole.AuthorizationsReadWrite],
        userId: user._id,
      });
    });

    context('when a Namespace Limit is exceeded', function () {
      it('throws an error', async function () {
        namespace.limits = NamespaceLimits.mock();
        await namespace.save();

        const ctx = new ContextMock({
          params: { namespaceId: namespace._id },
          request: { body: { roles: [] } },
          state: { user },
        } as any);

        const promise = handler(ctx as any);

        return expect(promise).to.be.rejectedWith(NamespaceLimitError);
      });
    });

    context('when a Namespace Limit is not exceeded', function () {
      it('creates an Authorization', async function () {
        const ctx = new ContextMock({
          params: { namespaceId: namespace._id },
          request: { body: { roles: [], userId: otherUser._id } },
          state: { user },
        } as any);

        await handler(ctx as any);

        expect(ctx.response.body.record).to.exist;
      });
    });
  });

  context('when permission is denied', function () {
    it('throws an error', async function () {
      const namespace = await Namespace.mock({ limits: NamespaceLimits.mock() });

      const ctx = new ContextMock({
        params: { namespaceId: namespace._id },
        request: { body: { roles: [], userId: user._id } },
        state: { user },
      } as any);

      const promise = handler(ctx as any);

      return expect(promise).to.be.rejectedWith(PermissionError);
    });
  });
});
