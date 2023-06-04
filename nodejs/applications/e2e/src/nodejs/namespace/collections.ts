import wait from '@tenlastic/wait';
import { expect } from 'chai';
import * as Chance from 'chance';

import dependencies from '../../dependencies';
import * as helpers from '../helpers';

const chance = new Chance();

describe('/nodejs/namespace/collections', function () {
  let namespace: string;

  beforeEach(function () {
    namespace = `Angular - Builds (${chance.hash({ length: 16 })})`;
  });

  afterEach(async function () {
    await wait(1 * 1000, 15 * 1000, () => helpers.deleteNamespace(namespace));
  });

  it('creates a Namespace, Collection, and Record', async function () {
    // Create the Namespace.
    const { _id } = await helpers.createNamespace(namespace);

    // Create the Collection.
    const collection = await dependencies.collectionService.create(_id, {
      jsonSchema: {
        properties: {
          email: { type: 'string' },
          name: { type: 'string' },
        },
        required: ['email', 'name'],
        type: 'object',
      },
      name: chance.hash({ length: 32 }),
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
    const record = await dependencies.recordService.create(_id, collection._id, {
      properties: { email: chance.email(), name: chance.hash() },
    });
    expect(record).to.exist;
  });
});
