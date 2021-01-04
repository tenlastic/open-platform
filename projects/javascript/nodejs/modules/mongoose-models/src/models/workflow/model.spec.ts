import { expect, use } from 'chai';
import * as chaiAsPromised from 'chai-as-promised';
import * as Chance from 'chance';
import * as sinon from 'sinon';

import { NamespaceLimitsMock, NamespaceMock, NamespaceWorkflowLimitsMock } from '../namespace';
import { WorkflowMock } from './model.mock';
import { Workflow } from './model';

const chance = new Chance();
let sandbox: sinon.SinonSandbox;

use(chaiAsPromised);

beforeEach(function() {
  sandbox = sinon.createSandbox();

  sandbox.stub(Workflow.prototype, 'createKubernetesResources').resolves();
  sandbox.stub(Workflow.prototype, 'deleteKubernetesResources').resolves();
});

afterEach(function() {
  sandbox.restore();
});

describe('models/workflow/model', function() {
  describe('checkNamespaceLimits()', function() {
    it('enforces the workflows.count Namespace limit', async function() {
      const namespace = await NamespaceMock.create({
        limits: NamespaceLimitsMock.create({
          workflows: NamespaceWorkflowLimitsMock.create({ count: 1 }),
        }),
      });
      await WorkflowMock.create({ namespaceId: namespace._id });

      const promise = Workflow.checkNamespaceLimits(1, false, namespace._id, 0, []);

      return expect(promise).to.be.rejectedWith(
        'Namespace limit reached: workflows.count. Value: 1.',
      );
    });

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
      const promise = Workflow.checkNamespaceLimits(0, false, namespace._id, 0, templates as any);

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
      const promise = Workflow.checkNamespaceLimits(0, false, namespace._id, 0, templates as any);

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

      const promise = Workflow.checkNamespaceLimits(0, false, namespace._id, 2, []);

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

      const promise = Workflow.checkNamespaceLimits(0, false, namespace._id, 0, []);

      return expect(promise).to.be.rejectedWith(
        'Namespace limit reached: workflows.preemptible. Value: true.',
      );
    });
  });
});
