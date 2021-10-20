import {
  CollectionModel,
  collectionService,
  databaseLogService,
  DatabaseModel,
  databaseService,
  NamespaceModel,
  namespaceService,
  RecordModel,
  recordService,
} from '@tenlastic/http';
import { expect, use } from 'chai';
import * as chaiAsPromised from 'chai-as-promised';
import * as Chance from 'chance';
import { step } from 'mocha-steps';

import { wait } from '../wait';

const chance = new Chance();
use(chaiAsPromised);

describe('databases', function() {
  let collection: CollectionModel;
  let database: DatabaseModel;
  let namespace: NamespaceModel;
  let record: RecordModel;

  before(async function() {
    namespace = await namespaceService.create({ name: chance.hash() });
  });

  after(async function() {
    await namespaceService.delete(namespace._id);
  });

  step('creates a database, collection, and record', async function() {
    database = await databaseService.create({
      cpu: 0.1,
      memory: 250 * 1000 * 1000,
      name: chance.hash(),
      namespaceId: namespace._id,
      preemptible: true,
      replicas: 1,
      storage: 5 * 1000 * 1000 * 1000,
    });
    expect(database).to.exist;

    await wait(10000, 10 * 60 * 1000, async () => {
      database = await databaseService.findOne(database._id);
      return database.status?.phase === 'Running';
    });

    collection = await collectionService.create(database._id, {
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
          default: ['_id', 'collectionId', 'createdAt', 'properties.*', 'databaseId', 'updatedAt'],
        },
        roles: [],
        update: { default: ['properties.*'] },
      },
    });
    expect(collection).to.exist;

    record = await recordService.create(database._id, collection._id, {
      properties: { email: chance.email(), name: chance.hash() },
    });
    expect(record).to.exist;
  });

  step('generates logs', async function() {
    const logs = await wait(2.5 * 1000, 10 * 1000, async () => {
      const response = await databaseLogService.find(
        database._id,
        database.status.nodes[0]._id,
        {},
      );
      return response.length > 0 ? response : null;
    });

    expect(logs.length).to.be.greaterThan(0);
  });

  step('scales up', async function() {
    database = await databaseService.update(database._id, { replicas: 3 });
    await wait(10000, 10 * 60 * 1000, async () => {
      database = await databaseService.findOne(database._id);
      return database.status?.nodes?.length === 12 && database.status?.phase === 'Running';
    });

    collection = await collectionService.findOne(database._id, collection._id);
    record = await recordService.findOne(database._id, collection._id, record._id);

    expect(database).to.exist;
    expect(collection).to.exist;
    expect(record).to.exist;
  });

  step('scales down', async function() {
    database = await databaseService.update(database._id, { replicas: 1 });
    await wait(10000, 10 * 60 * 1000, async () => {
      database = await databaseService.findOne(database._id);
      return database.status?.nodes?.length === 4 && database.status?.phase === 'Running';
    });

    collection = await collectionService.findOne(database._id, collection._id);
    record = await recordService.findOne(database._id, collection._id, record._id);

    expect(database).to.exist;
    expect(collection).to.exist;
    expect(record).to.exist;
  });
});
