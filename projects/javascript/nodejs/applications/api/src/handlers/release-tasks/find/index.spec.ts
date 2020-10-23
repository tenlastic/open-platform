import { ContextMock } from '@tenlastic/web-server';
import { expect } from 'chai';

import {
  NamespaceMock,
  UserDocument,
  UserMock,
  ReleaseDocument,
  ReleaseTaskDocument,
  ReleaseMock,
  NamespaceUserMock,
  ReleaseTaskMock,
} from '@tenlastic/mongoose-models';
import { handler } from './';

describe('handlers/releases/tasks', function() {
  let record: ReleaseTaskDocument;
  let release: ReleaseDocument;
  let user: UserDocument;

  beforeEach(async function() {
    user = await UserMock.create();

    const namespaceUser = NamespaceUserMock.create({
      _id: user._id,
      roles: ['releases'],
    });
    const namespace = await NamespaceMock.create({ users: [namespaceUser] });
    release = await ReleaseMock.create({ namespaceId: namespace._id });

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
