import { expect, use } from 'chai';
import chaiAsPromised from 'chai-as-promised';
import { Chance } from 'chance';

import { ContextMock } from '../../mocks';
import { apiKeyMiddleware } from './';

const chance = new Chance();
const noop = async () => {};

use(chaiAsPromised);

describe('middleware/api-key', function () {
  it(`sets the API Key state object`, async function () {
    const ctx = ContextMock({
      request: {
        headers: {
          'x-api-key': chance.hash(),
        },
      },
    });

    await apiKeyMiddleware(ctx, noop);

    expect(ctx.state.apiKey).to.eql(ctx.request.headers['x-api-key']);
  });
});
