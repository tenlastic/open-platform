import {
  NamespaceModel,
  namespaceService,
  workflowLogService,
  WorkflowModel,
  workflowService,
} from '@tenlastic/http';
import { expect, use } from 'chai';
import * as chaiAsPromised from 'chai-as-promised';
import * as Chance from 'chance';
import { step } from 'mocha-steps';

import { wait } from '../wait';

const chance = new Chance();
use(chaiAsPromised);

describe('workflows', function() {
  let namespace: NamespaceModel;
  let workflow: WorkflowModel;

  before(async function() {
    namespace = await namespaceService.create({ name: chance.hash() });
  });

  after(async function() {
    await namespaceService.delete(namespace._id);
  });

  step('creates a workflow', async function() {
    workflow = await workflowService.create({
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
            script: {
              command: ['/bin/sh'],
              image: 'alpine:latest',
              source: 'echo "Hello World!"',
            },
          },
        ],
      },
      storage: 5 * 1000 * 1000 * 1000,
    });

    await wait(10000, 10 * 60 * 1000, async () => {
      workflow = await workflowService.findOne(workflow._id);
      return workflow.status?.phase === 'Succeeded';
    });
  });

  step('generates logs', async function() {
    const logs = await wait(2.5 * 1000, 10 * 1000, async () => {
      const node = workflow.status.nodes.find(n => n.type === 'Pod');
      const response = await workflowLogService.find(workflow._id, node._id, {});
      return response.length > 0 ? response : null;
    });

    expect(logs.length).to.be.greaterThan(0);
    expect(logs[0].body).to.eql('Hello World!');
  });
});
