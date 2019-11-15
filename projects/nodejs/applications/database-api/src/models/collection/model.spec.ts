import { expect, use } from 'chai';
import * as chaiAsPromised from 'chai-as-promised';
import * as mongoose from 'mongoose';
import * as sinon from 'sinon';

import { CollectionMock } from './model.mock';

use(chaiAsPromised);

describe('models/collection/model', function() {
  let sandbox: sinon.SinonSandbox;

  beforeEach(function() {
    sandbox = sinon.createSandbox();
  });

  afterEach(function() {
    sandbox.restore();
  });

  describe('jsonSchema', function() {
    it('does not return an error', async function() {
      const record = await CollectionMock.create({
        jsonSchema: {
          additionalProperties: false,
          properties: {
            name: { type: 'string' },
          },
          required: ['name'],
          type: 'object',
        },
      });

      expect(record).to.exist;
    });

    it('returns an error', function() {
      const promise = CollectionMock.create({
        jsonSchema: '{a:123}',
      });

      expect(promise).to.be.rejected;
    });
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
      const { properties } = $jsonSchema.properties;
      expect(properties.properties.name.bsonType).to.eql('string');
    });
  });
});
