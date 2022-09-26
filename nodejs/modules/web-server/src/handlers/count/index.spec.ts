import { expect } from 'chai';

import { ContextMock } from '../../context';
import { count } from './';

describe('handlers/count', function () {
  it('returns the number of matching records', async function () {
    const ctx = new ContextMock();
    const Permissions = { count: () => Promise.resolve(1) };

    const handler = count(Permissions as any);
    await handler(ctx as any);

    expect(ctx.response.body.count).to.eql(1);
  });
});
