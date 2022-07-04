import { expect } from 'chai';
import * as mongoose from 'mongoose';

import { substituteReferenceValues } from './';

describe('substitute-reference-values', function () {
  it('handles arrays', function () {
    const json = [{ name: { $ref: 'user._id' } }, { name: { first: 'first', last: 'last' } }];
    const references = { user: { _id: new mongoose.Types.ObjectId() } };

    const result = substituteReferenceValues(json, references);

    expect(result).to.eql([
      { name: references.user._id },
      { name: { first: 'first', last: 'last' } },
    ]);
  });

  it('handles objects', function () {
    const json = { _id: { $ref: 'user._id' }, name: { first: 'first', last: 'last' } };
    const references = { user: { _id: new mongoose.Types.ObjectId() } };

    const result = substituteReferenceValues(json, references);

    expect(result).to.eql({ _id: references.user._id, name: { first: 'first', last: 'last' } });
  });

  it('handles primitive values', function () {
    const json = 5;
    const references = { user: { _id: new mongoose.Types.ObjectId() } };

    const result = substituteReferenceValues(json, references);

    expect(result).to.eql(5);
  });

  it('handles subqueries', function () {
    const json = { _id: { $exists: { $ref: { 'user.roles': 'namespaces' } } } };
    const references = { user: { roles: ['namespaces'] } };

    const result = substituteReferenceValues(json, references);

    expect(result).to.eql({ _id: { $exists: true } });
  });
});
