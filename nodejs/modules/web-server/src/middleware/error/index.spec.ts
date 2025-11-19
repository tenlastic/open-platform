import { expect } from 'chai';
import { Chance } from 'chance';
import * as sinon from 'sinon';

import { ContextMock } from '../../mocks';
import { Context } from '../../types';
import { errorMiddleware } from './';

const chance = new Chance();
const noop = async () => {};

describe('middleware/error', function () {
  let ctx: Context;
  let message: string;
  let stub: sinon.SinonStub;

  beforeEach(function () {
    ctx = ContextMock();
    message = chance.hash();
  });

  context('when an error is thrown', function () {
    beforeEach(function () {
      const error = new Error(message);
      stub = sinon.stub().throws(error);
    });

    it('sets the response status to 400', async function () {
      await errorMiddleware(ctx, stub);

      expect(ctx.response.status).to.eql(400);
    });

    it('sets the response body to the error message', async function () {
      await errorMiddleware(ctx, stub);

      expect(ctx.response.body).to.eql({ errors: [{ message, name: 'Error' }] });
    });
  });

  context('when an error is not thrown', function () {
    it('does not alter the response', async function () {
      await errorMiddleware(ctx, noop);

      expect(ctx.response.body).to.eql({});
    });
  });
});
