import { expect } from 'chai';

import { validate } from './';

describe('validate', function() {
  const jsonSchema = {
    type: 'object',
    properties: {
      email: { type: 'string' },
      name: {
        type: 'object',
        properties: {
          first: { type: 'string' },
          last: { type: 'string' },
        },
        required: ['last'],
      },
    },
    required: ['email'],
  };

  context('when the object is invalid', function() {
    it('returns an array of errors', function() {
      const data = { name: { first: 3 } };
      const results = validate(jsonSchema, data);

      expect(results).to.eql([
        {
          keyword: 'required',
          dataPath: '',
          schemaPath: '#/required',
          params: { missingProperty: 'email' },
          message: "should have required property 'email'",
        },
        {
          keyword: 'type',
          dataPath: '.name.first',
          schemaPath: '#/properties/name/properties/first/type',
          params: { type: 'string' },
          message: 'should be string',
        },
        {
          keyword: 'required',
          dataPath: '.name',
          schemaPath: '#/properties/name/required',
          params: { missingProperty: 'last' },
          message: "should have required property 'last'",
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
