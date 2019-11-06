import { expect } from 'chai';

import { toMongo } from '../to-mongo';

describe('toMongo()', function() {
  context('when the schema is invalid', function() {
    it('throws an error', function() {
      const input = { type: 'objectttt' };
      const func = () => toMongo(input);

      expect(func).to.throw(/Unsupported JSON schema/);
    });

    it('throws an error', function() {
      const input = { type: 'object', properties: 'not an object' };
      const func = () => toMongo(input);

      expect(func).to.throw(/Unsupported JSON schema/);
    });

    it('throws an error', function() {
      const input = {
        properties: { email: { type: 'not a type' } },
        type: 'object',
      };
      const func = () => toMongo(input);

      expect(func).to.throw(/Unsupported JSON schema/);
    });
  });

  context('when the schema is valid', function() {
    it('converts the schema to mongoose', function() {
      const json = {
        properties: {
          address: {
            properties: {
              builtAt: { type: 'string', format: 'date-time' },
              street: { type: 'number', default: 44, minimum: 0, maximum: 50 },
            },
            required: ['builtAt'],
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

      const result = toMongo(json);

      expect(result).to.eql({
        bsonType: 'object',
        properties: {
          address: {
            bsonType: 'object',
            properties: {
              builtAt: { bsonType: 'date' },
              street: { bsonType: 'double', minimum: 0, maximum: 50 },
            },
            required: ['builtAt'],
          },
          anyValue: { bsonType: 'object' },
          arr: {
            bsonType: 'array',
            items: {
              bsonType: 'object',
              properties: {
                num: { bsonType: 'double' },
                str: { bsonType: 'string' },
              },
            },
          },
          id: { bsonType: 'string', pattern: /^\d{3}$/ },
          name: { bsonType: 'object' },
        },
      });
    });
  });
});
