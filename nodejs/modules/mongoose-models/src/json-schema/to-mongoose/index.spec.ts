import { expect } from 'chai';
import * as mongoose from 'mongoose';

import { toMongoose } from '../to-mongoose';

describe('json-schema/toMongoose', function () {
  context('when the schema is invalid', function () {
    it('throws an error', function () {
      const input = { type: 'objectttt' };
      const func = () => toMongoose(input);

      expect(func).to.throw(/Unsupported JSON schema/);
    });

    it('throws an error', function () {
      const input = { properties: 'not an object', type: 'object' };
      const func = () => toMongoose(input);

      expect(func).to.throw(/Unsupported JSON schema/);
    });

    it('throws an error', function () {
      const input = {
        properties: { email: { type: 'not a type' } },
        type: 'object',
      };
      const func = () => toMongoose(input);

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
          anyValue: { a: 'b' },
          arr: {
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

      const result = toMongoose(json);

      expect(result).to.eql({
        address: {
          builtAt: Date,
          street: { default: 44, max: 50, min: 0, type: Number },
        },
        anyValue: mongoose.Schema.Types.Mixed,
        arr: [
          {
            num: { type: Number },
            str: { type: String },
          },
        ],
        id: { match: /^\d{3}$/, type: String },
        name: mongoose.Schema.Types.Mixed,
      });
    });
  });
});
