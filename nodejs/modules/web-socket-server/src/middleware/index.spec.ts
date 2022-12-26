import { expect } from 'chai';
import * as sinon from 'sinon';

import { Context } from '../definitions';
import { ContextMock } from '../mocks';
import { Middleware } from './';

describe('middleware', function () {
  let ctx: Context;
  let middleware: Middleware;

  beforeEach(function () {
    ctx = new ContextMock();
    middleware = new Middleware();
  });

  describe('run()', function () {
    it('calls each middleware', async function () {
      const firstSpy = sinon.spy();
      middleware.use(async (c, next) => {
        firstSpy();
        await next();
      });

      const secondSpy = sinon.spy();
      middleware.use(async (c, next) => {
        secondSpy();
        await next();
      });

      await middleware.run(ctx);

      expect(firstSpy.calledOnce).to.eql(true);
      expect(secondSpy.calledOnce).to.eql(true);
    });
  });

  describe('use()', function () {
    it('adds the middleware layer', function () {
      middleware.use(async (c, next) => await next());

      expect(middleware['layers'].length).to.eql(1);
    });
  });
});
