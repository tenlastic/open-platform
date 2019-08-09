import { expect } from 'chai';
import * as Chance from 'chance';
import * as mongoose from 'mongoose';

import { DatabaseDocument, CollectionDocument } from '../src/models';
import { request } from './request';
import { StubCleaner } from './stub-cleaner';

const chance = new Chance();
const stubCleaner = new StubCleaner();

describe('indexes', function() {
  let collection: Partial<CollectionDocument>;
  let database: Partial<DatabaseDocument>;

  before(async function() {
    const createdDatabase = await createDatabase();
    database = createdDatabase.body.record;

    const createdCollection = await createCollection(database._id);
    collection = createdCollection.body.record;
  });

  after(async function() {
    await stubCleaner.clean();
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
    const getCollectionWithIndex = await request(
      'get',
      `/databases/${database._id}/collections/${collection._id}`,
      null,
      user,
    );
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
    expect(post.statusCode).to.eql(200);

    // Wait for the Index to be deleted.
    await new Promise(resolve => setTimeout(resolve, 200));

    // Find the Collection again.
    const getCollectionWithoutIndex = await request(
      'get',
      `/databases/${database._id}/collections/${collection._id}`,
      null,
      user,
    );
    expect(getCollectionWithoutIndex.statusCode).to.eql(200);
    expect(getCollectionWithoutIndex.body.record.indexes.length).to.eql(0);
  });
});

/**
 * Create a stub Collection.
 */
async function createCollection(databaseId: string) {
  const params = { name: chance.hash() };
  const user = { activatedAt: new Date(), roles: ['Admin'] };

  const response = await request('post', `/databases/${databaseId}/collections`, params, user);
  stubCleaner.add(`/databases/${databaseId}/collections/${response.body.record._id}`);

  return response;
}

/**
 * Create a stub Database.
 */
async function createDatabase() {
  const params = { name: chance.hash(), userId: mongoose.Types.ObjectId() };
  const user = { activatedAt: new Date(), roles: ['Admin'] };

  const response = await request('post', '/databases', params, user);
  stubCleaner.add(`/databases/${response.body.record._id}`);

  return response;
}
