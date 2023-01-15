import { expect } from 'chai';
import * as sinon from 'sinon';

import { Request, Context, Method } from '../definitions';
import { Middleware } from '../middleware';
import { RequestMock, ContextMock } from '../mocks';
import { Router } from './index';

describe('router', function () {
  let ctx: Context;
  let request: Request;
  let router: Router;

  beforeEach(function () {
    ctx = new ContextMock();
    request = new RequestMock();
    router = new Router();
  });

  describe('delete()', function () {
    it('calls router.route()', function () {
      const spy = sinon.spy();
      router['route'] = spy;

      router.delete('/');

      expect(spy.calledOnce).to.eql(true);
    });
  });

  describe('get()', function () {
    it('adds a middleware layer for the route', function () {
      const spy = sinon.spy();
      router['route'] = spy;

      router.get('/');

      expect(spy.calledOnce).to.eql(true);
    });
  });

  describe('match()', function () {
    context('when the request matches the route', function () {
      it('returns true', function () {
        request.method = Method.Get;
        request.path = '/matching/path';

        const result = router['match'](Method.Get, '/matching/path', request);

        expect(result).to.eql(true);
      });
    });

    context('when the request matches the route', function () {
      it('returns false', function () {
        request.method = Method.Get;
        request.path = '/not/matching/path';

        const result = router['match'](Method.Get, '/matching/path', request);

        expect(result).to.eql(false);
      });
    });
  });

  describe('params()', function () {
    context('when there are no variables in the path', function () {
      it('returns an empty object', function () {
        const result = router['params']('/no/params', '/no/params');

        expect(result).to.eql({});
      });
    });

    context('when there are variables in the path', function () {
      it('returns an object with the names params', function () {
        const result = router['params']('/:first/:second', '/1/2');

        expect(result).to.eql({ first: '1', second: '2' });
      });
    });
  });

  describe('pathToRegExp()', function () {
    it('converts params to alphanumeric wildcards', function () {
      const regex = router['pathToRegExp']('/users/:id');

      expect(regex).to.eql(/^\/users\/([^\/]+)$/);
    });
  });

  describe('post()', function () {
    it('adds a middleware layer for the route', function () {
      const spy = sinon.spy();
      router['route'] = spy;

      router.post('/');

      expect(spy.calledOnce).to.eql(true);
    });
  });

  describe('patch()', function () {
    it('adds a middleware layer for the route', function () {
      const spy = sinon.spy();
      router['route'] = spy;

      router.patch('/');

      expect(spy.calledOnce).to.eql(true);
    });
  });

  describe('route()', function () {
    let spy: sinon.SinonSpy;

    beforeEach(function () {
      spy = sinon.spy();
      router['route'](Method.Get, '/matching/route', () => spy());
    });

    it('adds a middleware layer for the route', function () {
      expect(router.routes().length).to.eql(1);
    });

    context('when a request matches the route', function () {
      it("runs the route's middleware", async function () {
        ctx.request.method = Method.Get;
        ctx.request.path = '/matching/route';

        await new Middleware(router.routes()).run(ctx);

        expect(spy.calledOnce).to.eql(true);
      });
    });

    context('when a request matches the route', function () {
      it("runs the route's middleware", async function () {
        request.method = Method.Get;
        request.path = '/mismatching/route';

        await new Middleware(router.routes()).run(ctx);

        expect(spy.called).to.eql(false);
      });
    });
  });

  describe('use()', function () {
    it('adds a middleware layer for the route', function () {
      router.use(async (c, next) => await next());
      router.use(async (c, next) => await next());

      expect(router.routes().length).to.eql(2);
    });
  });
});
