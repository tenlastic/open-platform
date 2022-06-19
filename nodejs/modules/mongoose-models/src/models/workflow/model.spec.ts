import { expect, use } from 'chai';
import * as chaiAsPromised from 'chai-as-promised';

import { NamespaceLimitsMock, NamespaceMock, NamespaceWorkflowLimitsMock } from '../namespace';
import { Workflow } from './model';

use(chaiAsPromised);

describe('models/workflow/model', function() {
  describe('checkNamespaceLimits()', function() {
    it('enforces the workflows.cpu Namespace limit', async function() {
      const namespace = await NamespaceMock.create({
        limits: NamespaceLimitsMock.create({
          workflows: NamespaceWorkflowLimitsMock.create({ cpu: 1 }),
        }),
      });

      const promise = Workflow.checkNamespaceLimits(2, 1, namespace._id, 1, true, 1);

      return expect(promise).to.be.rejectedWith(
        'Namespace limit reached: workflows.cpu. Value: 1.',
      );
    });

    it('enforces the workflows.memory Namespace limit', async function() {
      const namespace = await NamespaceMock.create({
        limits: NamespaceLimitsMock.create({
          workflows: NamespaceWorkflowLimitsMock.create({ memory: 1 }),
        }),
      });

      const promise = Workflow.checkNamespaceLimits(1, 2, namespace._id, 1, true, 1);

      return expect(promise).to.be.rejectedWith(
        'Namespace limit reached: workflows.memory. Value: 1.',
      );
    });

    it('enforces the workflows.parallelism Namespace limit', async function() {
      const namespace = await NamespaceMock.create({
        limits: NamespaceLimitsMock.create({
          workflows: NamespaceWorkflowLimitsMock.create({ parallelism: 1 }),
        }),
      });

      const promise = Workflow.checkNamespaceLimits(1, 1, namespace._id, 2, true, 1);

      return expect(promise).to.be.rejectedWith(
        'Namespace limit reached: workflows.parallelism. Value: 1.',
      );
    });

    it('enforces the workflows.preemptible Namespace limit', async function() {
      const namespace = await NamespaceMock.create({
        limits: NamespaceLimitsMock.create({
          workflows: NamespaceWorkflowLimitsMock.create({ preemptible: true }),
        }),
      });

      const promise = Workflow.checkNamespaceLimits(1, 1, namespace._id, 1, false, 1);

      return expect(promise).to.be.rejectedWith(
        'Namespace limit reached: workflows.preemptible. Value: true.',
      );
    });

    it('enforces the workflows.storage Namespace limit', async function() {
      const namespace = await NamespaceMock.create({
        limits: NamespaceLimitsMock.create({
          workflows: NamespaceWorkflowLimitsMock.create({ storage: 1 }),
        }),
      });

      const promise = Workflow.checkNamespaceLimits(1, 1, namespace._id, 1, true, 2);

      return expect(promise).to.be.rejectedWith(
        'Namespace limit reached: workflows.storage. Value: 1.',
      );
    });
  });
});
