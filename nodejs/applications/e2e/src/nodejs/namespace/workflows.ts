import wait from '@tenlastic/wait';
import { expect } from 'chai';
import * as Chance from 'chance';

import dependencies from '../../dependencies';
import * as helpers from '../helpers';

const chance = new Chance();

describe('/nodejs/namespace/workflows', function () {
  let namespace: string;

  beforeEach(function () {
    namespace = chance.hash({ length: 32 });
  });

  afterEach(async function () {
    await wait(1 * 1000, 15 * 1000, () => helpers.deleteNamespace(namespace));
  });

  it('creates a Namespace and Workflow', async function () {
    // Create the Namespace.
    const { _id } = await helpers.createNamespace(namespace);

    // Create the Workflow.
    let workflow = await dependencies.workflowService.create(_id, {
      cpu: 0.1,
      memory: 100 * 1000 * 1000,
      name: chance.hash({ length: 32 }),
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

    // Wait for the Workflow to finish successfully.
    await wait(5 * 1000, 2 * 60 * 1000, async () => {
      workflow = await dependencies.workflowService.findOne(_id, workflow._id);
      return workflow.status.phase === 'Succeeded';
    });

    // Check for Workflow Logs.
    const logs = await wait(2.5 * 1000, 5 * 1000, async () => {
      const node = workflow.status.nodes.find((n) => n.type === 'Pod');
      const response = await dependencies.workflowLogService.find(
        _id,
        workflow._id,
        node.pod,
        node.container,
        {},
      );
      return response.length > 0 ? response : null;
    });
    expect(logs.length).to.be.greaterThan(0);
    expect(logs[0].body).to.eql('Hello World!');
  });
});
