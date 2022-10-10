import { expect } from 'chai';
import * as mongoose from 'mongoose';

import { parse } from '.';

describe('parse', function () {
  it('converts strings to Dates and ObjectIds', function () {
    const date = '2022-10-10T03:10:18.876Z';
    const number = 0;
    const objectId = '0123456789abcdef01234567';

    const input = {
      array: [date, number, objectId, { date, objectId }],
      date,
      number,
      object: { date, number, objectId },
      objectId,
    };

    const result = parse(input);

    expect(result.array[0]).to.eql(new Date(date));
    expect(result.array[1]).to.eql(number);
    expect(result.array[2]).to.eql(new mongoose.Types.ObjectId(objectId));
    expect(result.array[3].date).to.eql(new Date(date));
    expect(result.array[3].objectId).to.eql(new mongoose.Types.ObjectId(objectId));
    expect(result.date).to.eql(new Date(date));
    expect(result.number).to.eql(number);
    expect(result.object.date).to.eql(new Date(date));
    expect(result.object.number).to.eql(number);
    expect(result.object.objectId).to.eql(new mongoose.Types.ObjectId(objectId));
    expect(result.objectId).to.eql(new mongoose.Types.ObjectId(objectId));
  });
});
