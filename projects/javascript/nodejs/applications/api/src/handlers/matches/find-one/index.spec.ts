import { ContextMock } from '@tenlastic/web-server';
import { expect, use } from 'chai';
import * as chaiAsPromised from 'chai-as-promised';

import { MatchDocument, MatchMock, UserDocument, UserMock } from '../../../models';
import { handler } from './';

use(chaiAsPromised);

describe('handlers/matches/find-one', function() {
  let record: MatchDocument;
  let user: UserDocument;

  beforeEach(async function() {
    user = await UserMock.create();
    record = await MatchMock.create();
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
