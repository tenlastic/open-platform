import { ContextMock } from '@tenlastic/web-server';
import { expect } from 'chai';

import {
  FileDocument,
  FileMock,
  GameMock,
  NamespaceMock,
  UserDocument,
  UserMock,
  ReleaseDocument,
  ReleaseMock,
  UserRolesMock,
} from '../../../models';
import { handler } from './';

describe('handlers/files/find', function() {
  let release: ReleaseDocument;
  let record: FileDocument;
  let user: UserDocument;

  beforeEach(async function() {
    user = await UserMock.create();

    const userRoles = UserRolesMock.create({ roles: ['Administrator'], userId: user._id });
    const namespace = await NamespaceMock.create({ accessControlList: [userRoles] });
    const game = await GameMock.create({ namespaceId: namespace._id });
    release = await ReleaseMock.create({ gameId: game._id });
    record = await FileMock.create({ releaseId: release._id });
  });

  it('returns the number of matching records', async function() {
    const ctx = new ContextMock({
      params: { platform: record.platform, releaseId: release._id },
      state: { user: user.toObject() },
    });

    await handler(ctx as any);

    expect(ctx.response.body.records.length).to.eql(1);
    expect(ctx.response.body.records[0]._id.toString()).to.eql(record._id.toString());
  });
});