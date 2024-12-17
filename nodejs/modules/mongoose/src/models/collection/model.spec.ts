import { expect, use } from 'chai';
import * as chaiAsPromised from 'chai-as-promised';
import * as mongoose from 'mongoose';
import * as sinon from 'sinon';
import { CollectionIndexKeyModel } from './index';

import { CollectionIndexModel } from './index';
import { CollectionIndexOptionsModel } from './index/options';
import { CollectionJsonSchemaType, CollectionModel } from './model';

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
      const index = CollectionIndexModel.mock({
        keys: [CollectionIndexKeyModel.mock({ field: 'properties' })],
        options: CollectionIndexOptionsModel.mock({ unique: true }),
      });
      const collection = await CollectionModel.mock({ indexes: [index] }).save();

      const indexes = await mongoose.connection.db.collection(collection.mongoName).indexes();

      expect(indexes[1].key).to.eql({ properties: 1 });
      expect(indexes[1].name).to.eql(index._id.toString());
      expect(indexes[1].unique).to.eql(true);
    });

    it('deletes the index on the collection within MongoDB', async function () {
      const index = CollectionIndexModel.mock({
        options: CollectionIndexOptionsModel.mock({ unique: true }),
      });
      const collection = await CollectionModel.mock({ indexes: [index] }).save();

      collection.indexes = [];
      await collection.save();

      const indexes = await mongoose.connection.db.collection(collection.mongoName).indexes();

      expect(indexes.length).to.eql(1);
      expect(indexes[0].key).to.eql({ _id: 1 });
    });
  });

  describe('jsonSchema', function () {
    it('does not save', async function () {
      const jsonSchema = {
        properties: {
          number: {
            default: 0,
            type: CollectionJsonSchemaType.Number,
            blah: 'blah',
          },
          string: {
            default: '',
            type: CollectionJsonSchemaType.String,
          },
        },
        required: [],
        type: 'object',
      };

      const promise = CollectionModel.mock({ jsonSchema: jsonSchema as any }).save();

      return expect(promise).to.be.rejectedWith(
        '/properties/number must NOT have additional properties',
      );
    });

    it('saves', async function () {
      const record = await CollectionModel.mock({
        jsonSchema: {
          properties: {
            number: {
              default: 0,
              type: CollectionJsonSchemaType.Number,
            },
            string: {
              default: '',
              type: CollectionJsonSchemaType.String,
            },
          },
          required: [],
          type: 'object',
        },
      }).save();

      expect(record).to.exist;
    });
  });

  describe('setValidator()', function () {
    it('sets the validator on the collection within MongoDB', async function () {
      const collection = await CollectionModel.mock({
        jsonSchema: {
          properties: {
            name: { type: CollectionJsonSchemaType.String },
          },
          required: ['name'],
          type: CollectionJsonSchemaType.Object,
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
