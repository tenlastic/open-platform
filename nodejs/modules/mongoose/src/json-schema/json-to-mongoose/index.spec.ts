import { expect } from 'chai';
import * as mongoose from 'mongoose';

import { jsonToMongoose } from '.';

describe('json-schema/json-to-mongoose', function () {
  context('when the schema is invalid', function () {
    it('throws an error', function () {
      const input = { type: 'objectttt' };
      const func = () => jsonToMongoose(input);

      expect(func).to.throw(/Unsupported JSON schema/);
    });

    it('throws an error', function () {
      const input = { properties: 'not an object', type: 'object' };
      const func = () => jsonToMongoose(input);

      expect(func).to.throw(/Unsupported JSON schema/);
    });

    it('throws an error', function () {
      const input = {
        properties: { email: { type: 'not a type' } },
        type: 'object',
      };
      const func = () => jsonToMongoose(input);

      expect(func).to.throw(/Unsupported JSON schema/);
    });
  });

  context('when the schema is valid', function () {
    it('converts the schema to a valid mongoose schema', function () {
      const json = {
        properties: {
          _id: { pattern: '^[0-9A-Fa-f]{24}$', type: 'string' },
          address: {
            properties: {
              builtAt: { format: 'date-time', type: 'string' },
              street: { default: 44, maximum: 50, minimum: 0, type: 'number' },
            },
            type: 'object',
          },
          anyValue: { a: 'b' },
          array: {
            items: {
              properties: { num: { type: 'number' }, str: { type: 'string' } },
              type: 'object',
            },
            type: 'array',
          },
          id: { pattern: '^\\d{3}$', type: 'string' },
          name: { type: 'object' },
        },
        type: 'object',
      };

      const result = jsonToMongoose(json);

      expect(result).to.eql({
        _id: mongoose.Schema.Types.ObjectId,
        address: {
          builtAt: Date,
          street: { default: 44, max: 50, min: 0, type: Number },
        },
        anyValue: mongoose.Schema.Types.Mixed,
        array: [
          {
            _id: false,
            type: { num: { type: Number }, str: { type: String } },
          },
        ],
        id: { match: /^\d{3}$/, type: String },
        name: mongoose.Schema.Types.Mixed,
      });
    });
  });
});
