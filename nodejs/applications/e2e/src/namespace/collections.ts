import { CollectionModel, NamespaceModel, RecordModel } from '@tenlastic/http';
import { expect, use } from 'chai';
import * as chaiAsPromised from 'chai-as-promised';
import * as Chance from 'chance';
import { step } from 'mocha-steps';

import dependencies from '../dependencies';

const chance = new Chance();
use(chaiAsPromised);

describe('/nodejs/namespace/collections', function () {
  let collection: CollectionModel;
  let namespace: NamespaceModel;
  let record: RecordModel;

  before(async function () {
    namespace = await dependencies.namespaceService.create({ name: chance.hash() });
  });

  after(async function () {
    await dependencies.namespaceService.delete(namespace._id);
  });

  step('creates a collection, and record', async function () {
    collection = await dependencies.collectionService.create(namespace._id, {
      jsonSchema: {
        additionalProperties: false,
        properties: {
          email: { type: 'string' },
          name: { type: 'string' },
        },
        required: ['email', 'name'],
        type: 'object',
      },
      name: chance.hash(),
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

    record = await dependencies.recordService.create(namespace._id, collection._id, {
      properties: { email: chance.email(), name: chance.hash() },
    });
    expect(record).to.exist;
  });
});
