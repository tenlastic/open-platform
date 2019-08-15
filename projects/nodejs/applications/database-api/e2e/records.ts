import { expect } from 'chai';
import * as Chance from 'chance';

import { DatabaseDocument, CollectionDocument, RecordDocument } from '../src/models';
import { CollectionModel, DatabaseModel, RecordModel } from './models';

const chance = new Chance();

describe('records', function() {
  let collection: Partial<CollectionDocument>;
  let database: Partial<DatabaseDocument>;

  before(async function() {
    const createdDatabase = await DatabaseModel.create();
    database = createdDatabase.body.record;

    const createdCollection = await CollectionModel.create({
      databaseId: database._id,
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
        find: {},
        read: {
          base: ['_id', 'collectionId', 'createdAt', 'customProperties', 'databaseId', 'updatedAt'],
        },
        roles: [],
        update: { base: ['customProperties'] },
      },
    });
    collection = createdCollection.body.record;
  });

  after(async function() {
    await CollectionModel.deleteAll();
    await DatabaseModel.deleteAll();
    await RecordModel.deleteAll();
  });

  it('does not create an invalid record', async function() {
    const res = await RecordModel.create({
      customProperties: { age: chance.integer() },
      collectionId: collection._id,
      databaseId: database._id,
    });

    expect(res.statusCode).to.eql(400);
  });

  it('creates create a valid record', async function() {
    const initialEmail = chance.email();
    const initialName = chance.name();
    const res = await RecordModel.create({
      customProperties: {
        email: initialEmail,
        name: initialName,
      },
      collectionId: collection._id,
      databaseId: database._id,
    });

    expect(res.statusCode).to.eql(200);
    expect(res.body.record.customProperties.email).to.eql(initialEmail);
    expect(res.body.record.customProperties.name).to.eql(initialName);
  });

  describe('working with an existing record', function() {
    let record: RecordDocument;

    beforeEach(async function() {
      const res = await RecordModel.create({
        customProperties: {
          email: chance.email(),
          name: chance.name(),
        },
        collectionId: collection._id,
        databaseId: database._id,
      });

      record = res.body.record;
    });

    it('finds the record', async function() {
      const res = await RecordModel.findOne({
        _id: record._id,
        collectionId: collection._id,
        databaseId: database._id,
      });

      expect(res.statusCode).to.eql(200);
      expect(res.body.record.customProperties.email).to.eql(record.customProperties.email);
      expect(res.body.record.customProperties.name).to.eql(record.customProperties.name);
    });

    it('updates the record', async function() {
      const newEmail = chance.email();
      const newName = chance.name();

      const res = await RecordModel.update({
        _id: record._id,
        customProperties: {
          email: newEmail,
          name: newName,
        },
        collectionId: collection._id,
        databaseId: database._id,
      });

      expect(res.statusCode).to.eql(200);
      expect(res.body.record.customProperties.email).to.eql(newEmail);
      expect(res.body.record.customProperties.name).to.eql(newName);
    });

    it('deletes the record', async function() {
      const res = await RecordModel.delete({
        _id: record._id,
        collectionId: collection._id,
        databaseId: database._id,
      });

      expect(res.statusCode).to.eql(200);
    });
  });
});
