import { expect, use } from 'chai';
import * as chaiAsPromised from 'chai-as-promised';

import { NamespaceLimits } from './limits';
import { Namespace, NamespaceLimitError } from './model';

use(chaiAsPromised);

describe('models/namespace', function () {
  describe('checkCpuLimit()', function () {
    it('returns an error', async function () {
      const namespace = await Namespace.mock({
        limits: NamespaceLimits.mock({ cpu: 1 }),
      }).save();

      const result = namespace.checkCpuLimit.bind(namespace, 2);

      expect(result).to.throw(NamespaceLimitError);
    });

    it('returns nothing', async function () {
      const namespace = await Namespace.mock({
        limits: NamespaceLimits.mock({ cpu: 1 }),
      }).save();

      const result = namespace.checkCpuLimit(1);

      expect(result).to.not.exist;
    });
  });

  describe('checkDefaultAuthorizationLimit()', function () {
    it('returns an error', async function () {
      const namespace = await Namespace.mock({
        limits: NamespaceLimits.mock({ defaultAuthorization: false }),
      }).save();

      const result = namespace.checkDefaultAuthorizationLimit.bind(namespace, true);

      expect(result).to.throw(NamespaceLimitError);
    });

    it('returns nothing', async function () {
      const namespace = await Namespace.mock({ limits: NamespaceLimits.mock() }).save();

      const result = namespace.checkDefaultAuthorizationLimit(false);

      expect(result).to.not.exist;
    });
  });

  describe('checkMemoryLimit()', function () {
    it('returns an error', async function () {
      const namespace = await Namespace.mock({
        limits: NamespaceLimits.mock({ memory: 1 }),
      }).save();

      const result = namespace.checkMemoryLimit.bind(namespace, 2);

      expect(result).to.throw(NamespaceLimitError);
    });

    it('returns nothing', async function () {
      const namespace = await Namespace.mock({
        limits: NamespaceLimits.mock({ memory: 1 }),
      }).save();

      const result = namespace.checkMemoryLimit(1);

      expect(result).to.not.exist;
    });
  });

  describe('checkPreemptibleLimit()', function () {
    it('returns an error', async function () {
      const namespace = await Namespace.mock({
        limits: NamespaceLimits.mock({ preemptible: true }),
      }).save();

      const result = namespace.checkPreemptibleLimit.bind(namespace, false);

      expect(result).to.throw(NamespaceLimitError);
    });

    it('returns nothing', async function () {
      const namespace = await Namespace.mock({
        limits: NamespaceLimits.mock({ preemptible: true }),
      }).save();

      const result = namespace.checkPreemptibleLimit(true);

      expect(result).to.not.exist;
    });
  });

  describe('checkStorageLimit()', function () {
    it('returns an error', async function () {
      const namespace = await Namespace.mock({
        limits: NamespaceLimits.mock({ storage: 1 }),
      }).save();

      const result = namespace.checkStorageLimit.bind(namespace, 2);

      expect(result).to.throw(NamespaceLimitError);
    });

    it('returns nothing', async function () {
      const namespace = await Namespace.mock({
        limits: NamespaceLimits.mock({ storage: 1 }),
      }).save();

      const result = namespace.checkStorageLimit(1);

      expect(result).to.not.exist;
    });
  });
});
