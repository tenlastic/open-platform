import { expect } from 'chai';
import * as Chance from 'chance';

import { DatabaseDocument, CollectionDocument } from '../src/models';
import { CollectionModel, DatabaseModel } from './models';
import { request } from './request';

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

  it('creates and deletes an index', async function() {
    const user = { activatedAt: new Date(), roles: ['Admin'] };

    // Create a new Index.
    const key = chance.hash();
    const post = await request(
      'post',
      `/databases/${database._id}/collections/${collection._id}/indexes`,
      { key: { [key]: 1 }, options: { unique: 1 } },
      user,
    );
    expect(post.statusCode).to.eql(200);

    // Wait for the Index to be created.
    await new Promise(resolve => setTimeout(resolve, 200));

    // Find the Collection.
    const getCollectionWithIndex = await CollectionModel.findOne({
      _id: collection._id,
      databaseId: database._id,
    });
    expect(getCollectionWithIndex.statusCode).to.eql(200);

    const index = getCollectionWithIndex.body.record.indexes[0];
    expect(index.key).to.eql({ [key]: 1 });
    expect(index.options).to.eql({ unique: 1 });

    // Delete the Index.
    const del = await request(
      'delete',
      `/databases/${database._id}/collections/${collection._id}/indexes/${index._id}`,
      null,
      user,
    );
    expect(del.statusCode).to.eql(200);

    // Wait for the Index to be deleted.
    await new Promise(resolve => setTimeout(resolve, 200));

    // Find the Collection again.
    const getCollectionWithoutIndex = await CollectionModel.findOne({
      _id: collection._id,
      databaseId: database._id,
    });
    expect(getCollectionWithoutIndex.statusCode).to.eql(200);
    expect(getCollectionWithoutIndex.body.record.indexes.length).to.eql(0);
  });
});
