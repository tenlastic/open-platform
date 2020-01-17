import { expect } from 'chai';

import { validate } from './';

describe('validate', function() {
  const jsonSchema = {
    properties: {
      email: { type: 'string' },
      name: {
        properties: {
          first: { type: 'string' },
          last: { type: 'string' },
        },
        required: ['last'],
        type: 'object',
      },
    },
    required: ['email'],
    type: 'object',
  };

  context('when the object is invalid', function() {
    it('returns an array of errors', function() {
      const data = { name: { first: 3 } };
      const results = validate(jsonSchema, data);

      expect(results).to.eql([
        {
          dataPath: '',
          keyword: 'required',
          message: `should have required property 'email'`,
          params: { missingProperty: 'email' },
          schemaPath: '#/required',
        },
        {
          dataPath: '.name.first',
          keyword: 'type',
          message: 'should be string',
          params: { type: 'string' },
          schemaPath: '#/properties/name/properties/first/type',
        },
        {
          dataPath: '.name',
          keyword: 'required',
          message: `should have required property 'last'`,
          params: { missingProperty: 'last' },
          schemaPath: '#/properties/name/required',
        },
      ]);
    });
  });

  context('when the object is valid', function() {
    it('returns an empty array', function() {
      const data = { email: 'test@example.com', name: { first: 'Test', last: 'User' } };
      const results = validate(jsonSchema, data);

      expect(results).to.eql([]);
    });
  });
});
