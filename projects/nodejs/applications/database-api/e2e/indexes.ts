import * as e2e from '@tenlastic/e2e';
import { expect } from 'chai';
import * as Chance from 'chance';

import { DatabaseDocument, CollectionDocument, IndexDocument } from '../src/models';
import { CollectionModel, DatabaseModel } from './models';

const chance = new Chance();

describe('indexes', function() {
  let collection: Partial<CollectionDocument>;
  let database: Partial<DatabaseDocument>;

  beforeEach(async function() {
    const createdDatabase = await DatabaseModel.create();
    database = createdDatabase.body.record;

    const createdCollection = await CollectionModel.create({ databaseId: database._id });
    collection = createdCollection.body.record;
  });

  afterEach(async function() {
    await CollectionModel.deleteAll();
    await DatabaseModel.deleteAll();
  });

  it('creates an index', async function() {
    const user = { activatedAt: new Date(), roles: ['Admin'] };

    // Create a new Index.
    const key = chance.hash();
    const createIndexResponse = await e2e.request(
      'post',
      `/databases/${database._id}/collections/${collection._id}/indexes`,
      { key: { [key]: 1 }, options: { unique: 1 } },
      { user },
    );
    expect(createIndexResponse.statusCode).to.eql(200);

    // Wait for the Index to be created.
    const index = await e2e.wait(2 * 1000, 30 * 1000, async () => {
      const getCollectionResponse = await CollectionModel.findOne({
        _id: collection._id,
        databaseId: collection.databaseId,
      });

      return getCollectionResponse.body.record.indexes[0];
    });

    expect(index.key).to.eql({ [key]: 1 });
    expect(index.options).to.eql({ unique: 1 });
  });

  describe('working with an existing collection', function() {
    let index: IndexDocument;

    beforeEach(async function() {
      const user = { activatedAt: new Date(), roles: ['Admin'] };

      // Create a new Index.
      const key = chance.hash();
      await e2e.request(
        'post',
        `/databases/${database._id}/collections/${collection._id}/indexes`,
        { key: { [key]: 1 }, options: { unique: 1 } },
        { user },
      );

      // Wait for the Index to be created.
      index = await e2e.wait(1 * 1000, 15 * 1000, async () => {
        const getCollectionResponse = await CollectionModel.findOne({
          _id: collection._id,
          databaseId: collection.databaseId,
        });

        return getCollectionResponse.body.record.indexes[0];
      });
    });

    it('deletes the index', async function() {
      const user = { activatedAt: new Date(), roles: ['Admin'] };

      // Delete the Index.
      const deleteIndexResponse = await e2e.request(
        'delete',
        `/databases/${database._id}/collections/${collection._id}/indexes/${index._id}`,
        null,
        { user },
      );
      expect(deleteIndexResponse.statusCode).to.eql(200);

      // Wait for the Index to be deleted.
      await e2e.wait(1 * 1000, 15 * 1000, async () => {
        const getCollectionResponse = await CollectionModel.findOne({
          _id: collection._id,
          databaseId: collection.databaseId,
        });

        return getCollectionResponse.body.record.indexes.length === 0;
      });
    });
  });
});
