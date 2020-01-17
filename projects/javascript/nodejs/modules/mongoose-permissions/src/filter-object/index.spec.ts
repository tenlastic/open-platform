import { expect } from 'chai';

import { filterObject } from './';

describe('filter-object', function() {
  it('handles primitive values', function() {
    const permissions = ['age', 'name'];
    const record = { age: 5, name: 'name', state: 'NJ' };

    const result: any = filterObject(record, permissions);

    expect(result.age).to.eql(5);
    expect(result.name).to.eql('name');
    expect(result.state).to.not.exist;
  });

  it('handles nested objects', function() {
    const permissions = [
      'jsonSchema.properties.age',
      'jsonSchema.properties.name.*',
      'jsonSchema.properties.state',
      'jsonSchema.type',
    ];
    const record = {
      jsonSchema: {
        properties: {
          age: {
            type: 'string',
          },
          country: {
            type: 'object',
          },
          name: {
            properties: {},
            type: 'object',
          },
          state: {},
        },
        type: 'object',
      },
    };

    const result: any = filterObject(record, permissions);

    expect(result.jsonSchema.properties.age).to.eql({});
    expect(result.jsonSchema.properties.country).to.not.exist;
    expect(result.jsonSchema.properties.name).to.eql({ properties: {}, type: 'object' });
    expect(result.jsonSchema.properties.state).to.eql({});
    expect(result.jsonSchema.type).to.eql('object');
  });
});
