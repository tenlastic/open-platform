import { expect } from 'chai';
import * as mongoose from 'mongoose';

import { jsonToMongoose } from '.';

describe('json-schema/json-to-mongoose', function () {
  context('when the schema is invalid', function () {
    it('throws an error', function () {
      const input = { type: 'objectttt' };
      const func = () => jsonToMongoose(input, null);

      expect(func).to.throw(/Unsupported JSON schema/);
    });

    it('throws an error', function () {
      const input = { properties: 'not an object', type: 'object' };
      const func = () => jsonToMongoose(input as any, null);

      expect(func).to.throw(/Unsupported JSON schema/);
    });

    it('throws an error', function () {
      const input = {
        properties: { email: { type: 'not a type' } },
        type: 'object',
      };
      const func = () => jsonToMongoose(input, null);

      expect(func).to.throw(/Unsupported JSON schema/);
    });
  });

  context('when the schema is valid', function () {
    it('converts the schema to a valid mongoose schema', function () {
      const json = {
        properties: {
          address: {
            properties: {
              builtAt: { format: 'date-time', type: 'string' },
              street: { default: 44, maximum: 50, minimum: 0, type: 'number' },
            },
            type: 'object',
          },
          array: { items: { type: 'string' }, type: 'array' },
          mixed: { type: 'object' },
          object: {
            properties: { key: { type: 'string' } },
            required: ['key'],
            type: 'object',
          },
          objectId: { pattern: '^[0-9A-Fa-f]{24}$', type: 'string' },
          string: { pattern: '^\\d{3}$', type: 'string' },
        },
        required: ['object'],
        type: 'object',
      };

      const result = jsonToMongoose(json, null);

      expect(result.path('address').schema['options']._id).to.eql(false);
      expect(result.path('address').schema.path('builtAt').instance).to.eql('Date');
      expect(result.path('address').schema.path('street').instance).to.eql('Number');
      expect(result.path('address').schema.path('street').options.default).to.eql(44);
      expect(result.path('address').schema.path('street').options.max).to.eql(50);
      expect(result.path('address').schema.path('street').options.min).to.eql(0);

      const array = result.path('array') as mongoose.Schema.Types.Array;
      expect(array.instance).to.eql('Array');
      expect(array.caster.instance).to.eql('String');

      expect(result.path('mixed').instance).to.eql('Mixed');

      expect(result.path('object').schema['options']._id).to.eql(false);
      expect(result.path('object').schema.path('key').instance).to.eql('String');
      expect(result.path('object').schema.path('key').options.required).to.eql(true);

      expect(result.path('objectId').instance).to.eql('ObjectID');

      expect(result.path('string').instance).to.eql('String');
      expect(result.path('string').options.match).to.eql(new RegExp('^\\d{3}$'));
    });
  });
});
