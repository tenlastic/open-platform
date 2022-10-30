import { PermissionError } from '@tenlastic/mongoose-permissions';
import { expect, use } from 'chai';
import * as chaiAsPromised from 'chai-as-promised';
import { Chance } from 'chance';

import { ContextMock } from '../../context';
import { updateOne } from './';

const chance = new Chance();
use(chaiAsPromised);

describe('handlers/update', function () {
  context('when permission is granted', function () {
    it('returns the record', async function () {
      const name = chance.hash();

      const ctx = new ContextMock();
      const Permissions = {
        findOne: () => Promise.resolve({ name }),
        read: () => Promise.resolve({ name }),
        update: () => Promise.resolve({ name }),
      };

      const handler = updateOne(Permissions as any);
      await handler(ctx as any);

      expect(ctx.response.body.record).to.exist;
    });
  });

  context('when permission is denied', function () {
    it('throws an error', async function () {
      const ctx = new ContextMock();
      const Permissions = { findOne: () => Promise.resolve(null) };

      const handler = updateOne(Permissions as any);
      const promise = handler(ctx as any);

      return expect(promise).to.be.rejectedWith(PermissionError);
    });
  });
});
