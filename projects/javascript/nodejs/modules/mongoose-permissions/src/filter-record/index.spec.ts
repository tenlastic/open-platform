import { expect } from 'chai';
import * as mongoose from 'mongoose';

import { Example, ExamplePermissions } from '../example-model';
import { filterRecord } from './';

describe('filter-record', function() {
  it('handles primitive values', function() {
    const permissions = ExamplePermissions.accessControl.options.create.roles.admin;
    const record = new Example({ name: 'name', userId: new mongoose.Types.ObjectId() });

    const result = filterRecord(record, permissions);

    expect(result.name).to.eql('name');
    expect(result.userId).to.not.exist;
  });

  it('handles nested objects', function() {
    const permissions = ExamplePermissions.accessControl.options.create.roles.admin;
    const record = new Example({
      properties: {
        age: 21,
        location: 'USA',
      },
    });

    const result = filterRecord(record, permissions);

    expect(result.properties.age).to.eql(21);
    expect(result.properties.location).to.not.exist;
  });
});
