import { expect } from 'chai';
import * as Chance from 'chance';
import * as sinon from 'sinon';

import { ContextMock } from '../../mocks';
import { errorMiddleware } from './error.middleware';

const chance = new Chance();
const noop = () => {};

describe('middleware/error', function() {
  let ctx: ContextMock;
  let message: string;
  let stub: sinon.SinonStub;

  beforeEach(function() {
    ctx = new ContextMock();
    message = chance.hash();
  });

  context('when an error is thrown', function() {
    beforeEach(function() {
      const error = new Error(message);
      stub = sinon.stub().throws(error);
    });

    it('sets the response status to 400', async function() {
      await errorMiddleware(ctx as any, stub);

      expect(ctx.response.status).to.eql(400);
    });

    it('sets the response body to the error message', async function() {
      await errorMiddleware(ctx as any, stub);

      expect(ctx.response.body).to.eql({ errors: [{ message, name: 'Error' }] });
    });
  });

  context('when an error is not thrown', function() {
    it('does not alter the response', async function() {
      await errorMiddleware(ctx as any, noop);

      expect(ctx.response.body).to.eql({});
    });
  });
});
