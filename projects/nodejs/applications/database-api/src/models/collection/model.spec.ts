import { expect } from 'chai';
import * as mongoose from 'mongoose';
import * as sinon from 'sinon';

import { CollectionMock } from './model.mock';

describe('models/collection/model', function() {
  let sandbox: sinon.SinonSandbox;

  beforeEach(function() {
    sandbox = sinon.createSandbox();
  });

  afterEach(function() {
    sandbox.restore();
  });

  describe('setValidator()', function() {
    it('sets the validator on the collection within MongoDB', async function() {
      const collection = await CollectionMock.create({
        jsonSchema: {
          additionalProperties: false,
          properties: {
            name: { type: 'string' },
          },
          required: ['name'],
          type: 'object',
        },
      });

      await collection.setValidator();

      const collections = await mongoose.connection.db
        .listCollections({ name: collection.id })
        .toArray();
      const { $jsonSchema } = collections[0].options.validator;
      const { customProperties } = $jsonSchema.properties;
      expect(customProperties.properties.name.bsonType).to.eql('string');
    });
  });
});
