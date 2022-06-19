import { expect } from 'chai';

import { toMongo } from '../to-mongo';

describe('json-schema/toMongo', function () {
  context('when the schema is invalid', function () {
    it('throws an error', function () {
      const input = { type: 'objectttt' };
      const func = () => toMongo(input);

      expect(func).to.throw(/Unsupported JSON schema/);
    });

    it('throws an error', function () {
      const input = { type: 'object', properties: 'not an object' };
      const func = () => toMongo(input);

      expect(func).to.throw(/Unsupported JSON schema/);
    });

    it('throws an error', function () {
      const input = {
        properties: { email: { type: 'not a type' } },
        type: 'object',
      };
      const func = () => toMongo(input);

      expect(func).to.throw(/Unsupported JSON schema/);
    });
  });

  context('when the schema is valid', function () {
    it('converts the schema to mongoose', function () {
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
        bsonType: ['null', 'object'],
        properties: {
          address: {
            bsonType: ['null', 'object'],
            properties: {
              builtAt: { bsonType: ['date', 'null'] },
              street: { bsonType: ['double', 'int', 'null'], minimum: 0, maximum: 50 },
            },
            required: ['builtAt'],
          },
          anyValue: { bsonType: ['null', 'object'] },
          arr: {
            bsonType: ['array', 'null'],
            items: {
              bsonType: ['null', 'object'],
              properties: {
                num: { bsonType: ['double', 'int', 'null'] },
                str: { bsonType: ['null', 'string'] },
              },
            },
          },
          id: { bsonType: ['null', 'string'], pattern: /^\d{3}$/ },
          name: { bsonType: ['null', 'object'] },
        },
      });
    });
  });
});
