import { ContextMock } from '@tenlastic/web-socket-server';
import { expect } from 'chai';

import { handler } from '.';

describe('web-socket-server/routes/probes/readiness', function () {
  it('returns a 200 status code', async function () {
    const ctx: any = new ContextMock();

    await handler(ctx);

    expect(ctx.response.status).to.eql(200);
  });
});
