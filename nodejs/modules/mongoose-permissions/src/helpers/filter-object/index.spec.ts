import { expect } from 'chai';
import * as mongoose from 'mongoose';

import { filterObject } from './';

describe('filter-object', function () {
  it('handles primitive values', function () {
    const permissions = ['age', 'name'];
    const record = { age: 5, name: 'name', state: 'NJ' };

    const result = filterObject('read', record, permissions);

    expect(result.age).to.eql(5);
    expect(result.name).to.eql('name');
    expect(result.state).to.not.exist;
  });

  it('handles nested objects', function () {
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

    const result = filterObject('read', record, permissions);

    expect(result.jsonSchema.properties.age).to.eql({});
    expect(result.jsonSchema.properties.country).to.not.exist;
    expect(result.jsonSchema.properties.name).to.eql({ properties: {}, type: 'object' });
    expect(result.jsonSchema.properties.state).to.eql({});
    expect(result.jsonSchema.type).to.eql('object');
  });

  it('handles arrays', function () {
    const permissions = ['templates.key', 'templates.templates.*', 'values'];
    const record = {
      keys: [1, 2, 3],
      templates: [
        { key: 0, value: 0 },
        { key: 1, value: 1 },
        { templates: [{ key: 2, value: 2 }] },
      ],
      values: [1, 2, 3],
    };

    const result = filterObject('read', record, permissions);

    expect(result.keys).to.not.exist;
    expect(result.templates[0].key).to.eql(0);
    expect(result.templates[0].value).to.not.exist;
    expect(result.templates[1].key).to.eql(1);
    expect(result.templates[1].value).to.not.exist;
    expect(result.templates[2].templates[0].key).to.eql(2);
    expect(result.templates[2].templates[0].value).to.eql(2);
    expect(result.values).to.eql(record.values);
  });

  it('handles the filter option', function () {
    const permissions = ['keys', 'templates.*', 'values'];
    const record = {
      keys: [1, 2, 3],
      templates: [
        { key: 0, value: 0 },
        { key: 1, value: 1 },
        { key: 2, templates: [{ key: 2, value: 2 }], value: 2 },
      ],
      values: [1, 2, 3],
    };
    const schema = new mongoose.Schema({
      keys: { type: [Number], filter: true },
      templates: {
        type: new mongoose.Schema({
          key: Number,
          templates: {
            type: new mongoose.Schema({ key: Number, value: Number }),
            filter: { read: true },
          },
          value: Number,
        }),
      },
    });

    const result = filterObject('read', record, permissions, schema);

    expect(result.keys).to.not.exist;
    expect(result.templates[0].key).to.eql(0);
    expect(result.templates[0].value).to.eql(0);
    expect(result.templates[1].key).to.eql(1);
    expect(result.templates[1].value).to.eql(1);
    expect(result.templates[2].key).to.eql(2);
    expect(result.templates[2].templates).to.not.exist;
    expect(result.templates[2].value).to.eql(2);
    expect(result.values).to.eql(record.values);
  });
});
