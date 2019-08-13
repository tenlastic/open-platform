import { expect } from 'chai';
import * as Chance from 'chance';
import * as mongoose from 'mongoose';

import { DatabaseDocument, CollectionDocument } from '../src/models';
import { request } from './request';
import { StubCleaner } from './stub-cleaner';

const chance = new Chance();
const stubCleaner = new StubCleaner();

describe.only('records', function() {
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

  it('creates and deletes a record', async function() {
    const user = { activatedAt: new Date(), roles: ['Admin'] };

    // Create an invalid Record.
    const invalidPost = await request(
      'post',
      `/databases/${database._id}/collections/${collection._id}`,
      { customProperties: { age: chance.integer() } },
      user,
    );
    expect(invalidPost.statusCode).to.eql(400);

    // Create a valid Record.
    const initialEmail = chance.email();
    const initialName = chance.name();
    const validPost = await request(
      'post',
      `/databases/${database._id}/collections/${collection._id}`,
      {
        customProperties: {
          email: initialEmail,
          name: initialName,
        },
      },
      user,
    );
    stubCleaner.add(
      `/databases/${database._id}/collections/${collection._id}/${validPost.body.record._id}/`,
    );
    expect(validPost.statusCode).to.eql(200);
    expect(validPost.body.record.customProperties.email).to.eql(initialEmail);
    expect(validPost.body.record.customProperties.name).to.eql(initialName);

    // Find the Record.
    const get = await request(
      'get',
      `/databases/${database._id}/collections/${collection._id}/${validPost.body.record._id}`,
      null,
      user,
    );
    expect(get.statusCode).to.eql(200);
    expect(validPost.body.record.customProperties.email).to.eql(initialEmail);
    expect(validPost.body.record.customProperties.name).to.eql(initialName);

    // Update the Record.
    const newEmail = chance.email();
    const newName = chance.name();
    const update = await request(
      'put',
      `/databases/${database._id}/collections/${collection._id}/${validPost.body.record._id}`,
      {
        customProperties: {
          email: newEmail,
          name: newName,
        },
      },
      user,
    );
    expect(update.statusCode).to.eql(200);
    expect(update.body.record.customProperties.email).to.eql(newEmail);
    expect(update.body.record.customProperties.name).to.eql(newName);

    // Delete the Record.
    const del = await request(
      'delete',
      `/databases/${database._id}/collections/${collection._id}/${validPost.body.record._id}`,
      null,
      user,
    );
    expect(del.statusCode).to.eql(200);
  });
});

/**
 * Create a stub Collection.
 */
async function createCollection(databaseId: string) {
  const params = {
    jsonSchema: {
      type: 'object',
      additionalProperties: false,
      properties: {
        email: { type: 'string' },
        name: { type: 'string' },
      },
    },
    name: chance.hash(),
    permissions: {
      create: { base: ['customProperties'] },
      delete: { base: true },
      read: { base: ['_id', 'createdAt', 'customProperties', 'updatedAt'] },
      update: { base: ['customProperties'] },
    },
  };
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
