import { expect } from 'chai';
import * as mongoose from 'mongoose';

import { substituteOidValues } from './';

describe('substitute-oid-values', function() {
  it('handles arrays', function() {
    const json = [
      { _id: { $oid: 'abcdef1234567890abcdef12' } },
      { name: { first: 'first', last: 'last' } },
    ];
    const result = substituteOidValues(json);

    const _id = result[0]._id;
    expect(_id).be.be.instanceOf(mongoose.Types.ObjectId);
    expect(_id.toString()).to.eql(json[0]._id.$oid);
  });

  it('handles objects', function() {
    const json = {
      _id: { $oid: 'abcdef1234567890abcdef12' },
      name: { first: 'first', last: 'last' },
    };
    const result = substituteOidValues(json);

    const _id = result._id;
    expect(_id).be.be.instanceOf(mongoose.Types.ObjectId);
    expect(_id.toString()).to.eql(json._id.$oid);
  });

  it('handles primitive values', function() {
    const json = 5;
    const result = substituteOidValues(json);

    expect(result).to.eql(5);
  });
});
