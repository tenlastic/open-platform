import { expect } from 'chai';

import { jsonSchemaPropertiesValidator } from './';

describe('validators/json-schema-properties', function() {
  describe('validator', function() {
    context('when the value is falsy', function() {
      it('returns true', function() {
        const result = jsonSchemaPropertiesValidator.validator(null);

        expect(result).to.eql(true);
      });
    });

    context('when the value is an invalid JSON string', function() {
      it('returns false', function() {
        const result = jsonSchemaPropertiesValidator.validator('{a:123}');

        expect(result).to.eql(false);
      });
    });

    context('when the value is a valid JSON string or object', function() {
      it('returns true', function() {
        const result = jsonSchemaPropertiesValidator.validator({
          properties: {
            name: {
              properties: {
                first: { type: 'string' },
                last: { type: 'object' },
              },
              type: 'object',
            },
          },
          type: 'object',
        });

        expect(result).to.eql(true);
      });

      it('returns false', function() {
        const result = jsonSchemaPropertiesValidator.validator({
          properties: {
            'name.first': { type: 'string' },
            'name.last': { type: 'string' },
          },
          type: 'object',
        });

        expect(result).to.eql(false);
      });
    });
  });
});
