import { expect } from 'chai';
import * as Chance from 'chance';
import * as mongoose from 'mongoose';

import { DatabaseDocument } from '../src/models';
import { request } from './request';
import { StubCleaner } from './stub-cleaner';

const chance = new Chance();
const stubCleaner = new StubCleaner();

describe('collections', function() {
  let database: Partial<DatabaseDocument>;

  before(async function() {
    const res = await createDatabase();
    database = res.body.record;
  });

  after(async function() {
    await stubCleaner.clean();
  });

  it('creates, finds, updates, and deletes a collection', async function() {
    const user = { activatedAt: new Date(), roles: ['Admin'] };

    // Create a new Collection.
    const initialName = chance.hash();
    const post = await request(
      'post',
      `/databases/${database._id}/collections`,
      { name: initialName },
      user,
    );
    stubCleaner.add(`/databases/${database._id}/collections/${post.body.record._id}`);
    expect(post.statusCode).to.eql(200);
    expect(post.body.record.name).to.eql(initialName);

    // Find the Collection.
    const get = await request(
      'get',
      `/databases/${database._id}/collections/${post.body.record._id}`,
      null,
      user,
    );
    expect(get.statusCode).to.eql(200);
    expect(get.body.record.name).to.eql(initialName);

    // Update the Collection.
    const newName = chance.hash();
    const update = await request(
      'put',
      `/databases/${database._id}/collections/${post.body.record._id}`,
      { name: newName },
      user,
    );
    expect(update.statusCode).to.eql(200);
    expect(update.body.record.name).to.eql(newName);

    // Delete the Collection.
    const del = await request(
      'delete',
      `/databases/${database._id}/collections/${post.body.record._id}`,
      null,
      user,
    );
    expect(del.statusCode).to.eql(200);
  });
});

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
