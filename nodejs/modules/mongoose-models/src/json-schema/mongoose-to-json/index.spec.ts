import { expect } from 'chai';
import * as mongoose from 'mongoose';

import { mongooseToJson } from '.';

describe('json-schema/mongoose-to-json', function () {
  it('converts the mongoose schema to a valid json schema', function () {
    const schema = new mongoose.Schema({
      array: [String],
      boolean: Boolean,
      buffer: Buffer,
      date: Date,
      decimal: mongoose.Schema.Types.Decimal128,
      map: mongoose.Schema.Types.Map,
      mixed: mongoose.Schema.Types.Mixed,
      number: Number,
      objectId: mongoose.Schema.Types.ObjectId,
      string: String,
    });

    const result = mongooseToJson(schema);

    expect(result).to.eql({
      properties: {
        _id: { pattern: '^[0-9A-Fa-f]{24}$', type: 'string' },
        array: { type: 'array' },
        boolean: { type: 'boolean' },
        date: { format: 'date-time', type: 'string' },
        decimal: { type: 'number' },
        map: { type: 'object' },
        mixed: { type: 'object' },
        number: { type: 'number' },
        objectId: { pattern: '^[0-9A-Fa-f]{24}$', type: 'string' },
        string: { type: 'string' },
      },
      type: 'object',
    });
  });
});
