import { ContextMock } from '@tenlastic/api-module';
import { expect } from 'chai';

import { UserMock, UserDocument } from '../../../models';
import { handler } from '.';

describe('handlers/delete', function() {
  let record: UserDocument;
  let user: any;

  beforeEach(async function() {
    record = await UserMock.create();
    user = { level: 1 };
  });

  it('returns the deleted record', async function() {
    const ctx = new ContextMock({
      params: {
        id: record._id,
      },
      state: {
        user,
      },
    });

    await handler(ctx as any);

    expect(ctx.response.body.record).to.exist;
  });
});
