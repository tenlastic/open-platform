import { CollectionModel, NamespaceModel, RecordModel } from '@tenlastic/http';
import wait from '@tenlastic/wait';
import { expect, use } from 'chai';
import * as chaiAsPromised from 'chai-as-promised';
import * as Chance from 'chance';

import dependencies from '../../dependencies';
import { step } from '../../step';

const chance = new Chance();
use(chaiAsPromised);

describe('/nodejs/namespace/collections', function () {
  let collection: CollectionModel;
  let namespace: NamespaceModel;
  let record: RecordModel;

  after(async function () {
    await dependencies.namespaceService.delete(namespace._id);
  });

  step('creates a Namespace', async function () {
    namespace = await dependencies.namespaceService.create({
      limits: {
        bandwidth: 1 * 1000 * 1000 * 1000,
        cpu: 1,
        memory: 1 * 1000 * 1000 * 1000,
        storage: 10 * 1000 * 1000 * 1000,
      },
      name: chance.hash({ length: 64 }),
    });
    expect(namespace).to.exist;
  });

  step('runs the Namespace successfully', async function () {
    await wait(5 * 1000, 60 * 1000, async () => {
      namespace = await dependencies.namespaceService.findOne(namespace._id);
      return namespace.status.phase === 'Running';
    });
  });

  step('creates a Collection', async function () {
    collection = await dependencies.collectionService.create(namespace._id, {
      jsonSchema: {
        properties: {
          email: { type: 'string' },
          name: { type: 'string' },
        },
        required: ['email', 'name'],
        type: 'object',
      },
      name: chance.hash({ length: 64 }),
      namespaceId: namespace._id,
      permissions: {
        create: { default: ['properties.*'] },
        delete: { default: true },
        find: { default: {} },
        read: {
          default: ['_id', 'collectionId', 'createdAt', 'properties.*', 'namespaceId', 'updatedAt'],
        },
        roles: [],
        update: { default: ['properties.*'] },
      },
    });

    expect(collection).to.exist;
  });

  step('creates a Record', async function () {
    record = await dependencies.recordService.create(namespace._id, collection._id, {
      properties: { email: chance.email(), name: chance.hash() },
    });

    expect(record).to.exist;
  });
});
