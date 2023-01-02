import { PermissionError } from '@tenlastic/mongoose-permissions';
import { expect, use } from 'chai';
import * as chaiAsPromised from 'chai-as-promised';
import * as Chance from 'chance';

import { ContextMock } from '../../context';
import { create } from './';

const chance = new Chance();
use(chaiAsPromised);

describe('handlers/create', function () {
  context('when permission is granted', function () {
    it('creates a new record', async function () {
      const name = chance.hash();

      const ctx = new ContextMock();
      const Permissions = {
        create: () => Promise.resolve({ name }),
        read: () => Promise.resolve({ name }),
      };

      const handler = create(Permissions as any);
      await handler(ctx as any);

      expect(ctx.response.body.record).to.eql({ name });
    });
  });

  context('when permission is denied', function () {
    it('throws an error', async function () {
      const ctx = new ContextMock();
      const Permissions = { create: () => Promise.reject(new PermissionError()) };

      const handler = create(Permissions as any);
      const promise = handler(ctx as any);

      return expect(promise).to.be.rejectedWith(PermissionError);
    });
  });
});
