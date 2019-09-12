import { expect } from 'chai';
import * as Chance from 'chance';

import { CollectionModel, DatabaseModel, NamespaceModel, RecordModel } from '../models';

const chance = new Chance();

describe('records', function() {
  let collection: Partial<CollectionModel>;
  let database: Partial<DatabaseModel>;
  let namespace: NamespaceModel;

  before(async function() {
    const result = await NamespaceModel.create();
    namespace = result.body.record;

    // Wait for Namespace to propagate to Database API.
    await new Promise(resolve => setTimeout(resolve, 30000));
  });

  beforeEach(async function() {
    const createdDatabase = await DatabaseModel.create({ namespaceId: namespace._id });
    database = createdDatabase.body.record;

    const createdCollection = await CollectionModel.create({
      databaseId: database._id,
      jsonSchema: {
        additionalProperties: false,
        properties: {
          age: { type: 'number' },
          email: { type: 'string' },
          name: { type: 'string' },
        },
        required: ['email', 'name'],
        type: 'object',
      },
      name: chance.hash(),
      permissions: {
        create: {
          base: ['customProperties.*'],
        },
        delete: { base: true },
        find: {
          base: {},
        },
        read: {
          base: [
            '_id',
            'collectionId',
            'createdAt',
            'customProperties.*',
            'databaseId',
            'updatedAt',
          ],
        },
        roles: [],
        update: {
          base: ['customProperties.*'],
        },
      },
    });
    collection = createdCollection.body.record;
  });

  after(async function() {
    await NamespaceModel.deleteAll();
  });

  afterEach(async function() {
    await CollectionModel.deleteAll();
    await DatabaseModel.deleteAll();
    await RecordModel.deleteAll();
  });

  it('does not create an invalid record', async function() {
    const res = await RecordModel.create({
      collectionId: collection._id,
      customProperties: { age: chance.hash() },
      databaseId: database._id,
    });

    expect(res.statusCode).to.eql(400);
    expect(res.body.errors[0].name).to.eql('CastError');
    expect(res.body.errors[1].name).to.eql('ValidatorError');
    expect(res.body.errors[1].path).to.eql('customProperties.name');
    expect(res.body.errors[2].name).to.eql('ValidatorError');
    expect(res.body.errors[2].path).to.eql('customProperties.email');
  });

  it('creates create a valid record', async function() {
    const initialEmail = chance.email();
    const initialName = chance.name();
    const res = await RecordModel.create({
      collectionId: collection._id,
      customProperties: {
        email: initialEmail,
        name: initialName,
      },
      databaseId: database._id,
    });

    expect(res.statusCode).to.eql(200);
    expect(res.body.record.customProperties.email).to.eql(initialEmail);
    expect(res.body.record.customProperties.name).to.eql(initialName);
  });

  describe('working with an existing record', function() {
    let record: RecordModel;

    beforeEach(async function() {
      const res = await RecordModel.create({
        collectionId: collection._id,
        customProperties: {
          email: chance.email(),
          name: chance.name(),
        },
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

    it('does not update a record with invalid values', async function() {
      const res = await RecordModel.update({
        _id: record._id,
        collectionId: collection._id,
        customProperties: { age: chance.hash(), email: null, name: null },
        databaseId: database._id,
      });

      expect(res.statusCode).to.eql(400);
      expect(res.body.errors[0].name).to.eql('CastError');
      expect(res.body.errors[1].name).to.eql('ValidatorError');
      expect(res.body.errors[1].path).to.eql('customProperties.email');
      expect(res.body.errors[2].name).to.eql('ValidatorError');
      expect(res.body.errors[2].path).to.eql('customProperties.name');
    });

    it('updates the record', async function() {
      const newEmail = chance.email();
      const newName = chance.name();

      const res = await RecordModel.update({
        _id: record._id,
        collectionId: collection._id,
        customProperties: {
          email: newEmail,
          name: newName,
        },
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
