import { ContextMock } from '@tenlastic/web-server';
import { expect } from 'chai';

import { NamespaceMock, UserDocument, UserMock, UserRolesMock } from '../../../models';
import { handler } from '.';

describe('handlers/namespaces/count', function() {
  let user: UserDocument;

  beforeEach(async function() {
    user = await UserMock.create();
    await NamespaceMock.create();

    const userRole = await UserRolesMock.create({ roles: ['Administrator'], userId: user._id });
    await NamespaceMock.create({ accessControlList: [userRole] });
  });

  it('returns the number of matching records', async function() {
    const ctx = new ContextMock({
      state: { user: user.toObject() },
    });

    await handler(ctx as any);

    expect(ctx.response.body.count).to.eql(1);
  });
});
