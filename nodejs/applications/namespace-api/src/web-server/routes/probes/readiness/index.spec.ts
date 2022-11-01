import { ContextMock } from '@tenlastic/web-server';
import { expect } from 'chai';

import { handler } from '.';

describe('web-server/probes/readiness', function () {
  it('returns a 200 status code', async function () {
    const ctx: any = new ContextMock();

    await handler(ctx);

    expect(ctx.response.status).to.eql(200);
  });
});
