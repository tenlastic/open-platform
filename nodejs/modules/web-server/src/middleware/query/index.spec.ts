import { expect } from 'chai';
import * as Chance from 'chance';

import { ContextMock } from '../../context';
import { queryMiddleware } from './';

const chance = new Chance();
const noop = async () => {};

describe('middleware/query', function () {
  context('when query is undefined', function () {
    let ctx: ContextMock;

    beforeEach(function () {
      ctx = new ContextMock();
    });

    it('does not alter the response', async function () {
      await queryMiddleware(ctx as any, noop);

      expect(ctx.request.query).to.eql({});
    });

    it('does not alter the response', async function () {
      ctx.request.query = {};

      await queryMiddleware(ctx as any, noop);

      expect(ctx.request.query).to.eql({});
    });
  });

  context('when the query is JSON', function () {
    it('parses the JSON into an object', async function () {
      const json = { key: chance.hash() };
      const ctx = new ContextMock({ request: { query: { json: JSON.stringify(json) } } });

      await queryMiddleware(ctx as any, noop);

      expect(ctx.request.query.json).to.be.undefined;
      expect(ctx.request.query.key).to.eql(json.key);
    });
  });

  context('when the query is not JSON', function () {
    it('parses the JSON from each value into an object', async function () {
      const where = { key: chance.hash() };
      const ctx = new ContextMock({ request: { query: { where: JSON.stringify(where) } } });

      await queryMiddleware(ctx as any, noop);

      expect(ctx.request.query.where).to.eql(where);
    });
  });
});
