import { expect, use } from 'chai';
import * as chaiAsPromised from 'chai-as-promised';

import { NamespaceLimitsMock } from './limits';
import { NamespaceLimitError } from './model';
import { NamespaceMock } from './model.mock';

use(chaiAsPromised);

describe('mongodb/models/namespace', function () {
  describe('checkDefaultAuthorizationLimit()', function () {
    it('returns an error', async function () {
      const namespace = await NamespaceMock.create({ limits: NamespaceLimitsMock.create() });

      const result = namespace.checkDefaultAuthorizationLimit.bind(namespace, true);

      expect(result).to.throw(NamespaceLimitError);
    });

    it('returns nothing', async function () {
      const namespace = await NamespaceMock.create({ limits: NamespaceLimitsMock.create() });

      const result = namespace.checkDefaultAuthorizationLimit(false);

      expect(result).to.not.exist;
    });
  });
});
