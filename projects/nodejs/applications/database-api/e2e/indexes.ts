import { expect } from 'chai';
import * as Chance from 'chance';

import { DatabaseDocument, CollectionDocument, IndexDocument } from '../src/models';
import { CollectionModel, DatabaseModel } from './models';
import { request } from './request';
import { wait } from './wait';

const chance = new Chance();

describe('indexes', function() {
  let collection: Partial<CollectionDocument>;
  let database: Partial<DatabaseDocument>;

  before(async function() {
    const createdDatabase = await DatabaseModel.create();
    database = createdDatabase.body.record;

    const createdCollection = await CollectionModel.create({ databaseId: database._id });
    collection = createdCollection.body.record;
  });

  after(async function() {
    await CollectionModel.deleteAll();
    await DatabaseModel.deleteAll();
  });

  it('creates an index', async function() {
    const user = { activatedAt: new Date(), roles: ['Admin'] };

    // Create a new Index.
    const key = chance.hash();
    const createIndexResponse = await request(
      'post',
      `/databases/${database._id}/collections/${collection._id}/indexes`,
      { key: { [key]: 1 }, options: { unique: 1 } },
      user,
    );
    expect(createIndexResponse.statusCode).to.eql(200);

    // Wait for the Index to be created.
    await wait(2 * 1000, 30 * 1000, async () => {
      const getCollectionResponse = await CollectionModel.findOne({
        _id: collection._id,
        databaseId: collection.databaseId,
      });

      return getCollectionResponse.body.record.indexes.length > 0;
    });

    const getCollectionResponse = await CollectionModel.findOne({
      _id: collection._id,
      databaseId: collection.databaseId,
    });
    expect(getCollectionResponse.statusCode).to.eql(200);

    const index = getCollectionResponse.body.record.indexes[0];
    expect(index.key).to.eql({ [key]: 1 });
    expect(index.options).to.eql({ unique: 1 });
  });

  describe('working with an existing collection', function() {
    let index: IndexDocument;

    beforeEach(async function() {
      const user = { activatedAt: new Date(), roles: ['Admin'] };

      // Create a new Index.
      const key = chance.hash();
      await request(
        'post',
        `/databases/${database._id}/collections/${collection._id}/indexes`,
        { key: { [key]: 1 }, options: { unique: 1 } },
        user,
      );

      // Wait for the Index to be created.
      await wait(2 * 1000, 30 * 1000, async () => {
        const getCollectionResponse = await CollectionModel.findOne({
          _id: collection._id,
          databaseId: collection.databaseId,
        });

        return getCollectionResponse.body.record.indexes.length > 0;
      });

      const getCollectionResponse = await CollectionModel.findOne({
        _id: collection._id,
        databaseId: collection.databaseId,
      });
      index = getCollectionResponse.body.record.indexes[0];
    });

    it('deletes the index', async function() {
      const user = { activatedAt: new Date(), roles: ['Admin'] };

      // Delete the Index.
      const deleteIndexResponse = await request(
        'delete',
        `/databases/${database._id}/collections/${collection._id}/indexes/${index._id}`,
        null,
        user,
      );
      expect(deleteIndexResponse.statusCode).to.eql(200);

      // Wait for the Index to be deleted.
      await wait(2 * 1000, 30 * 1000, async () => {
        const getCollectionResponse = await CollectionModel.findOne({
          _id: collection._id,
          databaseId: collection.databaseId,
        });

        return getCollectionResponse.body.record.indexes.length === 0;
      });
    });
  });
});
