import { ContextMock } from '@tenlastic/web-server';
import { expect } from 'chai';

import {
  FileDocument,
  FileMock,
  NamespaceMock,
  UserDocument,
  UserMock,
  ReleaseDocument,
  ReleaseMock,
  NamespaceRolesMock,
} from '@tenlastic/mongoose-models';
import { handler } from './';

describe('handlers/files/count', function() {
  let record: FileDocument;
  let release: ReleaseDocument;
  let user: UserDocument;

  beforeEach(async function() {
    user = await UserMock.create();

    const namespaceRoles = NamespaceRolesMock.create({
      roles: ['Administrator'],
      userId: user._id,
    });
    const namespace = await NamespaceMock.create({ accessControlList: [namespaceRoles] });

    release = await ReleaseMock.create({ namespaceId: namespace._id });
    record = await FileMock.create({ releaseId: release._id });
  });

  it('returns the number of matching records', async function() {
    const ctx = new ContextMock({
      params: { platform: record.platform, releaseId: release._id },
      state: { user: user.toObject() },
    });

    await handler(ctx as any);

    expect(ctx.response.body.count).to.eql(1);
  });
});
