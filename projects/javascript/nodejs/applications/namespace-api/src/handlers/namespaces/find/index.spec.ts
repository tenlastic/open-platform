import { ContextMock } from '@tenlastic/web-server';
import { expect } from 'chai';

import {
  NamespaceMock,
  ReadonlyUserDocument,
  ReadonlyUserMock,
  UserRolesMock,
} from '../../../models';
import { handler } from '.';

describe('handlers/namespaces/find', function() {
  let user: ReadonlyUserDocument;

  beforeEach(async function() {
    user = await ReadonlyUserMock.create();
    await NamespaceMock.create();

    const userRole = await UserRolesMock.create({ roles: ['Administrator'], userId: user._id });
    await NamespaceMock.create({ accessControlList: [userRole] });
  });

  it('returns the number of matching records', async function() {
    const ctx = new ContextMock({
      state: { user: user.toObject() },
    });

    await handler(ctx as any);

    expect(ctx.response.body.records).to.exist;
    expect(ctx.response.body.records.length).to.eql(1);
  });
});
