import { expect, use } from 'chai';
import * as chaiAsPromised from 'chai-as-promised';
import * as Chance from 'chance';

import { ContextMock } from '../../context';
import { apiKeyMiddleware } from './';

const chance = new Chance();
const noop = async () => {};

use(chaiAsPromised);

describe('middleware/api-key', function () {
  it(`sets the API Key state object`, async function () {
    const ctx = new ContextMock({
      request: {
        headers: {
          'x-api-key': chance.hash(),
        },
      },
    });

    await apiKeyMiddleware(ctx as any, noop);

    expect(ctx.state.apiKey).to.eql(ctx.request.headers['x-api-key']);
  });
});
