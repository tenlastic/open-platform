import { expect, use } from 'chai';
import * as chaiAsPromised from 'chai-as-promised';
import { Chance } from 'chance';

import { ContextMock } from '../../context';
import { deleteOne } from './';

const chance = new Chance();
use(chaiAsPromised);

describe('handlers/delete-one', function () {
  context('when permission is granted', function () {
    it('returns the deleted record', async function () {
      const name = chance.hash();

      const ctx = new ContextMock();
      const Permissions = {
        delete: () => Promise.resolve({ name }),
        findOne: () => Promise.resolve({ name }),
        read: () => Promise.resolve({ name }),
      };

      const handler = deleteOne(Permissions as any);
      await handler(ctx as any);

      expect(ctx.response.body.record).to.eql({ name });
    });
  });

  context('when permission is denied', function () {
    it('throws an error', async function () {
      const ctx = new ContextMock();
      const Permissions = { findOne: () => Promise.resolve(null) };

      const handler = deleteOne(Permissions as any);
      const promise = handler(ctx as any);

      return expect(promise).to.be.rejected;
    });
  });
});
