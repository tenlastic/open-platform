import { expect, use } from 'chai';
import * as chaiAsPromised from 'chai-as-promised';

import { NamespaceLimitsMock } from './limits';
import { NamespaceLimitError } from './model';
import { NamespaceMock } from './model.mock';

use(chaiAsPromised);

describe('mongodb/models/namespace', function () {
  describe('checkCpuLimit()', function () {
    it('returns an error', async function () {
      const namespace = await NamespaceMock.create({
        limits: NamespaceLimitsMock.create({ cpu: 1 }),
      });

      const result = namespace.checkCpuLimit.bind(namespace, 2);

      expect(result).to.throw(NamespaceLimitError);
    });

    it('returns nothing', async function () {
      const namespace = await NamespaceMock.create({
        limits: NamespaceLimitsMock.create({ cpu: 1 }),
      });

      const result = namespace.checkCpuLimit(1);

      expect(result).to.not.exist;
    });
  });

  describe('checkMemoryLimit()', function () {
    it('returns an error', async function () {
      const namespace = await NamespaceMock.create({
        limits: NamespaceLimitsMock.create({ memory: 1 }),
      });

      const result = namespace.checkMemoryLimit.bind(namespace, 2);

      expect(result).to.throw(NamespaceLimitError);
    });

    it('returns nothing', async function () {
      const namespace = await NamespaceMock.create({
        limits: NamespaceLimitsMock.create({ memory: 1 }),
      });

      const result = namespace.checkMemoryLimit(1);

      expect(result).to.not.exist;
    });
  });

  describe('checkPreemptibleLimit()', function () {
    it('returns an error', async function () {
      const namespace = await NamespaceMock.create({
        limits: NamespaceLimitsMock.create({ preemptible: true }),
      });

      const result = namespace.checkPreemptibleLimit.bind(namespace, false);

      expect(result).to.throw(NamespaceLimitError);
    });

    it('returns nothing', async function () {
      const namespace = await NamespaceMock.create({
        limits: NamespaceLimitsMock.create({ preemptible: true }),
      });

      const result = namespace.checkPreemptibleLimit(true);

      expect(result).to.not.exist;
    });
  });
});
