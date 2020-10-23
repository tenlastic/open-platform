import { ContextMock } from '@tenlastic/web-server';
import { expect } from 'chai';

import {
  QueueDocument,
  QueueMock,
  NamespaceMock,
  UserDocument,
  UserMock,
  NamespaceUserMock,
} from '@tenlastic/mongoose-models';
import { handler } from './';

describe('handlers/queues/find', function() {
  let record: QueueDocument;
  let user: UserDocument;

  beforeEach(async function() {
    user = await UserMock.create();

    const namespaceUser = NamespaceUserMock.create({
      _id: user._id,
      roles: ['queues'],
    });
    const namespace = await NamespaceMock.create({ users: [namespaceUser] });

    record = await QueueMock.create({ namespaceId: namespace._id });
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
