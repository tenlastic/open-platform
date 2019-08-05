import { expect } from 'chai';
import * as mongoose from 'mongoose';
import * as sinon from 'sinon';

import { CollectionMock } from './model.mock';
import { Collection } from './model';

describe('models/collection/model', function() {
  let sandbox: sinon.SinonSandbox;

  beforeEach(function() {
    sandbox = sinon.createSandbox();
  });

  afterEach(function() {
    sandbox.restore();
  });

  describe('createCollection()', function() {
    it('creates a new collection within MongoDB', async function() {
      const collection = new Collection({ _id: new mongoose.Types.ObjectId() });

      await collection.createCollection();

      const collections = await mongoose.connection.db.listCollections().toArray();
      expect(collections.map(c => c.name)).to.include(collection.id);
    });
  });

  describe('setValidator()', function() {
    it('sets the validator on the collection within MongoDB', async function() {
      const collection = await CollectionMock.create({
        jsonSchema: {
          additionalProperties: false,
          bsonType: 'object',
          properties: {
            name: { bsonType: 'string' },
          },
          required: ['name'],
        },
      });

      await collection.setValidator();

      const collections = await mongoose.connection.db.listCollections({ name: collection.id }).toArray();
      const { $jsonSchema } = collections[0].options.validator;
      const { customProperties } = $jsonSchema.properties;
      expect(customProperties.properties.name.bsonType).to.eql('string');
    });
  });
});
