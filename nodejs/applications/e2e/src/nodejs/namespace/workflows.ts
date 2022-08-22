import { NamespaceModel, WorkflowModel } from '@tenlastic/http';
import wait from '@tenlastic/wait';
import { expect, use } from 'chai';
import * as chaiAsPromised from 'chai-as-promised';
import * as Chance from 'chance';

import dependencies from '../../dependencies';
import { step } from '../../step';

const chance = new Chance();
use(chaiAsPromised);

describe('/nodejs/namespace/workflows', function () {
  let namespace: NamespaceModel;
  let workflow: WorkflowModel;

  before(async function () {
    namespace = await dependencies.namespaceService.create({ name: chance.hash() });
  });

  after(async function () {
    await dependencies.namespaceService.delete(namespace._id);
  });

  step('creates a Workflow', async function () {
    workflow = await dependencies.workflowService.create(namespace._id, {
      cpu: 0.1,
      memory: 100 * 1000 * 1000,
      name: chance.hash(),
      namespaceId: namespace._id,
      preemptible: true,
      spec: {
        entrypoint: 'entrypoint',
        parallelism: 1,
        templates: [
          {
            dag: { tasks: [{ name: 'Echo', template: 'Echo' }] },
            name: 'entrypoint',
          },
          {
            name: 'Echo',
            script: { command: ['/bin/sh'], image: 'alpine:latest', source: 'echo "Hello World!"' },
          },
        ],
      },
      storage: 5 * 1000 * 1000 * 1000,
    });
  });

  step('finishes the Workflow successfully', async function () {
    const phase = await wait(10000, 10 * 60 * 1000, async () => {
      workflow = await dependencies.workflowService.findOne(namespace._id, workflow._id);
      return workflow.status?.finishedAt ? workflow.status.phase : null;
    });

    expect(phase).to.eql('Succeeded');
  });

  step('generates logs', async function () {
    const logs = await wait(2.5 * 1000, 10 * 1000, async () => {
      const node = workflow.status.nodes.find((n) => n.type === 'Pod');
      const response = await dependencies.workflowLogService.find(
        namespace._id,
        workflow._id,
        node._id,
        {},
      );
      return response.length > 0 ? response : null;
    });

    expect(logs.length).to.be.greaterThan(0);
    expect(logs[0].body).to.eql('Hello World!');
  });
});
