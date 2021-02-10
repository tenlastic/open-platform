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
          workflows: NamespaceWorkflowLimitsMock.create({ cpu: 0.1 }),
        }),
      });

      const templates = [
        {
          script: { resources: { cpu: 0.1 } },
          sidecars: [{ resources: { cpu: 0.1 } }],
        },
      ];
      const promise = Workflow.checkNamespaceLimits(false, namespace._id, 0, templates as any);

      return expect(promise).to.be.rejectedWith(
        'Namespace limit reached: workflows.cpu. Value: 0.1.',
      );
    });

    it('enforces the workflows.memory Namespace limit', async function() {
      const namespace = await NamespaceMock.create({
        limits: NamespaceLimitsMock.create({
          workflows: NamespaceWorkflowLimitsMock.create({ memory: 0.1 }),
        }),
      });

      const templates = [
        {
          script: { resources: { memory: 0.1 } },
          sidecars: [{ resources: { memory: 0.1 } }],
        },
      ];
      const promise = Workflow.checkNamespaceLimits(false, namespace._id, 0, templates as any);

      return expect(promise).to.be.rejectedWith(
        'Namespace limit reached: workflows.memory. Value: 0.1.',
      );
    });

    it('enforces the workflows.parallelism Namespace limit', async function() {
      const namespace = await NamespaceMock.create({
        limits: NamespaceLimitsMock.create({
          workflows: NamespaceWorkflowLimitsMock.create({ parallelism: 1 }),
        }),
      });

      const promise = Workflow.checkNamespaceLimits(false, namespace._id, 2, []);

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

      const promise = Workflow.checkNamespaceLimits(false, namespace._id, 0, []);

      return expect(promise).to.be.rejectedWith(
        'Namespace limit reached: workflows.preemptible. Value: true.',
      );
    });
  });
});
