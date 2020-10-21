import { ContextMock } from '@tenlastic/web-server';
import { expect } from 'chai';

import {
  NamespaceMock,
  UserDocument,
  UserMock,
  ReleaseDocument,
  ReleaseMock,
  NamespaceRolesMock,
} from '@tenlastic/mongoose-models';
import { handler } from './';

describe('handlers/releases/find', function() {
  let record: ReleaseDocument;
  let user: UserDocument;

  beforeEach(async function() {
    user = await UserMock.create();

    const namespaceRoles = NamespaceRolesMock.create({
      roles: ['Administrator'],
      userId: user._id,
    });
    const namespace = await NamespaceMock.create({ accessControlList: [namespaceRoles] });

    record = await ReleaseMock.create({ namespaceId: namespace._id });
  });

  it('returns the matching records', async function() {
    const ctx = new ContextMock({
      state: { user: user.toObject() },
    });

    await handler(ctx as any);

    expect(ctx.response.body.records.length).to.eql(1);
    expect(ctx.response.body.records[0]._id.toString()).to.eql(record._id.toString());
  });
});
