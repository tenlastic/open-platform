import { ContextMock } from '@tenlastic/web-server';
import { expect } from 'chai';

import {
  RefreshTokenDocument,
  RefreshTokenMock,
  UserDocument,
  UserMock,
} from '@tenlastic/mongoose-models';
import { handler } from './';

describe('handlers/refresh-tokens/find', function() {
  let record: RefreshTokenDocument;
  let user: UserDocument;

  beforeEach(async function() {
    user = await UserMock.create();
    record = await RefreshTokenMock.create({ userId: user._id });
  });

  it('returns the matching records', async function() {
    const ctx = new ContextMock({
      state: { user: user.toObject() },
    });

    await handler(ctx as any);

    expect(ctx.response.body.records.length).to.eql(1);
    expect(ctx.response.body.records[0].jti.toString()).to.eql(record.jti.toString());
  });
});
