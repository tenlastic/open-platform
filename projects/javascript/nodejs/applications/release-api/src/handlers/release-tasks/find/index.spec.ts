import { ContextMock } from '@tenlastic/web-server';
import { expect } from 'chai';

import {
  ReadonlyGameMock,
  ReadonlyNamespaceMock,
  ReadonlyUserDocument,
  ReadonlyUserMock,
  ReleaseDocument,
  ReleaseTaskDocument,
  ReleaseMock,
  UserRolesMock,
  ReleaseTaskMock,
} from '../../../models';
import { handler } from './';

describe('handlers/releases/tasks', function() {
  let record: ReleaseTaskDocument;
  let release: ReleaseDocument;
  let user: ReadonlyUserDocument;

  beforeEach(async function() {
    user = await ReadonlyUserMock.create();

    const userRoles = UserRolesMock.create({ roles: ['Administrator'], userId: user._id });
    const namespace = await ReadonlyNamespaceMock.create({ accessControlList: [userRoles] });
    const game = await ReadonlyGameMock.create({ namespaceId: namespace._id });
    release = await ReleaseMock.create({ gameId: game._id });

    record = await ReleaseTaskMock.create({ releaseId: release._id });
    await ReleaseTaskMock.create();
  });

  it('returns the matching records', async function() {
    const ctx = new ContextMock({
      params: { releaseId: release._id },
      state: { user: user.toObject() },
    });

    await handler(ctx as any);

    expect(ctx.response.body.records.length).to.eql(1);
    expect(ctx.response.body.records[0]._id.toString()).to.eql(record._id.toString());
  });
});
