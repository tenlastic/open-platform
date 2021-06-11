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

describe.only('workflows', function() {
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
              source: 'echo "Hello Everyone!"',
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
    await new Promise(resolve => setTimeout(resolve, 10 * 60 * 1000));
    const logs = await workflowLogService.find(workflow._id, {});
    expect(logs.length).to.be.greaterThan(0);
  });
});
