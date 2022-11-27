import { expect, use } from 'chai';
import * as chaiAsPromised from 'chai-as-promised';
import * as mongoose from 'mongoose';
import * as sinon from 'sinon';

import { CollectionIndex } from './index';
import { Collection } from './model';

use(chaiAsPromised);

describe('models/collection', function () {
  let sandbox: sinon.SinonSandbox;

  beforeEach(function () {
    sandbox = sinon.createSandbox();
  });

  afterEach(function () {
    sandbox.restore();
  });

  describe(`pre('save')`, function () {
    it('creates an index on the collection within MongoDB', async () => {
      const index = await CollectionIndex.mock({
        _id: new mongoose.Types.ObjectId(),
        key: { properties: 1 },
        options: { unique: true },
      }).save();
      const collection = await Collection.mock({ indexes: [index] }).save();

      const indexes = await mongoose.connection.db.collection(collection.mongoName).indexes();

      expect(indexes[1].key).to.eql({ properties: 1 });
      expect(indexes[1].name).to.eql(index._id.toString());
      expect(indexes[1].unique).to.eql(true);
    });

    it('deletes the index on the collection within MongoDB', async function () {
      const index = await CollectionIndex.mock({
        _id: new mongoose.Types.ObjectId(),
        key: { properties: 1 },
        options: { unique: true },
      }).save();
      const collection = await Collection.mock({ indexes: [index] }).save();

      collection.indexes = [];
      await collection.save();

      const indexes = await mongoose.connection.db.collection(collection.mongoName).indexes();

      expect(indexes.length).to.eql(1);
      expect(indexes[0].key).to.eql({ _id: 1 });
    });
  });

  describe('jsonSchema', function () {
    it('does not return an error', async function () {
      const record = await Collection.mock({
        jsonSchema: {
          additionalProperties: false,
          properties: {
            name: { type: 'string' },
          },
          required: ['name'],
          type: 'object',
        },
      }).save();

      expect(record).to.exist;
    });

    it('returns an error', function () {
      const promise = Collection.mock({
        jsonSchema: '{a:123}',
      }).save();

      expect(promise).to.be.rejected;
    });
  });

  describe('setValidator()', function () {
    it('sets the validator on the collection within MongoDB', async function () {
      const collection = await Collection.mock({
        jsonSchema: {
          additionalProperties: false,
          properties: {
            name: { type: 'string' },
          },
          required: ['name'],
          type: 'object',
        },
      }).save();

      await collection.setValidator();

      const collections = await mongoose.connection.db
        .listCollections({ name: collection.mongoName }, { nameOnly: false })
        .toArray();
      const { $jsonSchema } = collections[0].options.validator;
      const { properties } = $jsonSchema.properties;
      expect(properties.properties.name.bsonType).to.eql(['null', 'string']);
    });
  });
});
