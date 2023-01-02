import { expect, use } from 'chai';
import * as chaiAsPromised from 'chai-as-promised';

import { NamespaceLimitsModel } from './limits';
import { NamespaceModel, NamespaceLimitError } from './model';

use(chaiAsPromised);

describe('models/namespace', function () {
  describe('checkCpuLimit()', function () {
    it('returns an error', async function () {
      const namespace = await NamespaceModel.mock({
        limits: NamespaceLimitsModel.mock({ cpu: 1 }),
      }).save();

      const result = namespace.checkCpuLimit.bind(namespace, 2);

      expect(result).to.throw(NamespaceLimitError);
    });

    it('returns nothing', async function () {
      const namespace = await NamespaceModel.mock({
        limits: NamespaceLimitsModel.mock({ cpu: 1 }),
      }).save();

      const result = namespace.checkCpuLimit(1);

      expect(result).to.not.exist;
    });
  });

  describe('checkDefaultAuthorizationLimit()', function () {
    it('returns an error', async function () {
      const namespace = await NamespaceModel.mock({
        limits: NamespaceLimitsModel.mock({ defaultAuthorization: false }),
      }).save();

      const result = namespace.checkDefaultAuthorizationLimit.bind(namespace, true);

      expect(result).to.throw(NamespaceLimitError);
    });

    it('returns nothing', async function () {
      const namespace = await NamespaceModel.mock({ limits: NamespaceLimitsModel.mock() }).save();

      const result = namespace.checkDefaultAuthorizationLimit(false);

      expect(result).to.not.exist;
    });
  });

  describe('checkMemoryLimit()', function () {
    it('returns an error', async function () {
      const namespace = await NamespaceModel.mock({
        limits: NamespaceLimitsModel.mock({ memory: 1 }),
      }).save();

      const result = namespace.checkMemoryLimit.bind(namespace, 2);

      expect(result).to.throw(NamespaceLimitError);
    });

    it('returns nothing', async function () {
      const namespace = await NamespaceModel.mock({
        limits: NamespaceLimitsModel.mock({ memory: 1 }),
      }).save();

      const result = namespace.checkMemoryLimit(1);

      expect(result).to.not.exist;
    });
  });

  describe('checkNonPreemptibleLimit()', function () {
    it('returns an error', async function () {
      const namespace = await NamespaceModel.mock({
        limits: NamespaceLimitsModel.mock({ nonPreemptible: false }),
      }).save();

      const result = namespace.checkNonPreemptibleLimit.bind(namespace, false);

      expect(result).to.throw(NamespaceLimitError);
    });

    it('returns nothing', async function () {
      const namespace = await NamespaceModel.mock({
        limits: NamespaceLimitsModel.mock({ nonPreemptible: false }),
      }).save();

      const result = namespace.checkNonPreemptibleLimit(true);

      expect(result).to.not.exist;
    });
  });

  describe('checkStorageLimit()', function () {
    it('returns an error', async function () {
      const namespace = await NamespaceModel.mock({
        limits: NamespaceLimitsModel.mock({ storage: 1 }),
      }).save();

      const result = namespace.checkStorageLimit.bind(namespace, 2);

      expect(result).to.throw(NamespaceLimitError);
    });

    it('returns nothing', async function () {
      const namespace = await NamespaceModel.mock({
        limits: NamespaceLimitsModel.mock({ storage: 1 }),
      }).save();

      const result = namespace.checkStorageLimit(1);

      expect(result).to.not.exist;
    });
  });
});
