import { ContextMock } from '@tenlastic/web-server';
import { expect, use } from 'chai';
import * as chaiAsPromised from 'chai-as-promised';

import {
  RefreshTokenDocument,
  RefreshTokenMock,
  UserDocument,
  UserMock,
} from '@tenlastic/mongoose-models';
import { handler } from './';

use(chaiAsPromised);

describe('handlers/refresh-tokens/find-one', function() {
  let record: RefreshTokenDocument;
  let user: UserDocument;

  beforeEach(async function() {
    user = await UserMock.create();
    record = await RefreshTokenMock.create({ userId: user._id });
  });

  it('returns the record', async function() {
    const ctx = new ContextMock({
      params: {
        jti: record.jti,
      },
      state: { user: user.toObject() },
    });

    await handler(ctx as any);

    expect(ctx.response.body.record).to.exist;
  });
});
