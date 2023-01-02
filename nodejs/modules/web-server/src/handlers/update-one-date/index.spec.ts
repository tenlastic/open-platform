import { PermissionError } from '@tenlastic/mongoose-permissions';
import { expect, use } from 'chai';
import * as chaiAsPromised from 'chai-as-promised';

import { ContextMock } from '../../context';
import { updateOneDate } from './';

use(chaiAsPromised);

describe('handlers/update-one-date', function () {
  context('when permission is granted', function () {
    it('returns the record', async function () {
      const yesterday = new Date(Date.now() - 1 * 24 * 60 * 60 * 1000);
      const record = {
        save() {
          return Promise.resolve(this);
        },
        set(k, v) {
          this[k] = v;
          return this;
        },
        updatedAt: yesterday,
      };

      const ctx = new ContextMock();
      const Permissions = {
        findOne: () => Promise.resolve(record),
        getFieldPermissions: () => ['updatedAt'],
        read: (c, r) => Promise.resolve(r),
      };

      const handler = updateOneDate('updatedAt' as any, Permissions as any);
      await handler(ctx as any);

      expect(ctx.response.body.record).to.exist;
      expect(ctx.response.body.record.updatedAt).to.be.greaterThan(yesterday);
    });
  });

  context('when permission is denied', function () {
    it('throws an error', async function () {
      const ctx = new ContextMock();
      const Permissions = {
        findOne: () => Promise.resolve({}),
        getFieldPermissions: () => ['updatedAt'],
      };

      const handler = updateOneDate('key' as any, Permissions as any);
      const promise = handler(ctx as any);

      return expect(promise).to.be.rejectedWith(PermissionError);
    });
  });
});
