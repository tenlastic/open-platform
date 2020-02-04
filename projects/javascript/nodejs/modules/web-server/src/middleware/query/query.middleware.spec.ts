import { expect } from 'chai';
import * as Chance from 'chance';

import { ContextMock } from '../../mocks';
import { queryMiddleware } from './query.middleware';

const chance = new Chance();
const noop = async () => {};

describe('middleware/query', function() {
  context('when query is undefined', function() {
    let ctx: ContextMock;

    beforeEach(function() {
      ctx = new ContextMock();
    });

    it('does not alter the response', async function() {
      await queryMiddleware(ctx as any, noop);

      expect(ctx.request.query).to.eql({});
    });

    it('does not alter the response', async function() {
      ctx.request.query = {};

      await queryMiddleware(ctx as any, noop);

      expect(ctx.request.query).to.eql({});
    });
  });

  context('when the query is defined', function() {
    it('converts the query from a string to an object', async function() {
      const json = { key: chance.hash() };
      const ctx = new ContextMock({
        request: {
          query: {
            query: JSON.stringify(json),
          },
        },
      });

      await queryMiddleware(ctx as any, noop);

      expect(ctx.request.query.query).to.be.undefined;
      expect(ctx.request.query.key).to.eql(json.key);
    });
  });
});
