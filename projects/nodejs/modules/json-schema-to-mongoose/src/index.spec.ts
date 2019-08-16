import { expect } from 'chai';
import * as mongoose from 'mongoose';

import { convert } from './';

describe('convert()', function() {
  context('when the schema is invalid', function() {
    it('throws an error', function() {
      const input = { bsonType: 'objectttt' };
      const func = () => convert(input);

      expect(func).to.throw(/Unsupported JSON schema/);
    });

    it('throws an error', function() {
      const input = { bsonType: 'object', properties: 'not an object' };
      const func = () => convert(input);

      expect(func).to.throw(/Unsupported JSON schema/);
    });

    it('throws an error', function() {
      const input = {
        bsonType: 'object',
        properties: { email: { bsonType: 'not a bsonType' } },
      };
      const func = () => convert(input);

      expect(func).to.throw(/Unsupported JSON schema/);
    });
  });

  context('when the schema is valid', function() {
    it('converts the schema to mongoose', function() {
      const json = {
        bsonType: 'object',
        properties: {
          address: {
            bsonType: 'object',
            properties: {
              builtAt: { bsonType: 'date' },
              street: { bsonType: 'double', default: 44, minimum: 0, maximum: 50 },
            },
          },
          anyValue: { a: 'b' },
          arr: {
            bsonType: 'array',
            items: {
              bsonType: 'object',
              properties: { num: { bsonType: 'double' }, str: { bsonType: 'string' } },
            },
          },
          id: { bsonType: 'string', pattern: '^\\d{3}$' },
          name: { bsonType: 'object' },
        },
      };

      const result = convert(json);

      expect(result).to.eql({
        address: {
          street: { type: Number, default: 44, min: 0, max: 50 },
          builtAt: { type: Date },
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
