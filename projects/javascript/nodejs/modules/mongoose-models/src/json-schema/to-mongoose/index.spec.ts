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
      const input = { type: 'object', properties: 'not an object' };
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
              builtAt: { type: 'string', format: 'date-time' },
              street: { type: 'number', default: 44, minimum: 0, maximum: 50 },
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
          id: { type: 'string', pattern: '^\\d{3}$' },
          name: { type: 'object' },
        },
        type: 'object',
      };

      const result = toMongoose(json);

      expect(result).to.eql({
        address: {
          builtAt: Date,
          street: { type: Number, default: 44, min: 0, max: 50 },
        },
        anyValue: mongoose.Schema.Types.Mixed,
        arr: [
          {
            num: { type: Number },
            str: { type: String },
          },
        ],
        id: { type: String, match: /^\d{3}$/ },
        name: mongoose.Schema.Types.Mixed,
      });
    });
  });
});
