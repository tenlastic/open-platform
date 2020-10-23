import { ContextMock } from '@tenlastic/web-server';
import { expect, use } from 'chai';
import * as chaiAsPromised from 'chai-as-promised';

import {
  GameServerDocument,
  NamespaceMock,
  UserDocument,
  UserMock,
  NamespaceUserMock,
  GameServerMock,
} from '@tenlastic/mongoose-models';
import { handler } from './';

use(chaiAsPromised);

describe('handlers/game-servers/find-one', function() {
  let record: GameServerDocument;
  let user: UserDocument;

  beforeEach(async function() {
    user = await UserMock.create();

    const namespaceUser = NamespaceUserMock.create({
      _id: user._id,
      roles: ['game-servers'],
    });
    const namespace = await NamespaceMock.create({ users: [namespaceUser] });
    record = await GameServerMock.create({ namespaceId: namespace._id });
  });

  it('returns the record', async function() {
    const ctx = new ContextMock({
      params: {
        _id: record._id,
      },
      state: { user: user.toObject() },
    });

    await handler(ctx as any);

    expect(ctx.response.body.record).to.exist;
  });
});
