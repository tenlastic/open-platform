import { NamespaceModel } from '@tenlastic/http';
import { expect } from 'chai';
import * as Chance from 'chance';

import dependencies from '../../dependencies';
import * as helpers from '../helpers';

const chance = new Chance();

describe('/nodejs/namespace/collections', function () {
  let namespace: NamespaceModel;

  afterEach(async function () {
    await helpers.deleteNamespace(namespace?._id);
  });

  it('creates a Namespace, Collection, and Record', async function () {
    // Create the Namespace.
    namespace = await helpers.createNamespace();

    // Create the Collection.
    const collection = await dependencies.collectionService.create(namespace._id, {
      jsonSchema: {
        properties: {
          email: { type: 'string' },
          name: { type: 'string' },
        },
        required: ['email', 'name'],
        type: 'object',
      },
      name: chance.hash({ length: 64 }),
      permissions: {
        create: { public: ['properties.*'] },
        delete: { public: true },
        find: { public: {} },
        read: {
          public: ['_id', 'collectionId', 'createdAt', 'properties.*', 'namespaceId', 'updatedAt'],
        },
        roles: { public: {} },
        update: { public: ['properties.*'] },
      },
    });
    expect(collection).to.exist;

    // Create the Record.
    const record = await dependencies.recordService.create(namespace._id, collection._id, {
      properties: { email: chance.email(), name: chance.hash() },
    });
    expect(record).to.exist;
  });
});
