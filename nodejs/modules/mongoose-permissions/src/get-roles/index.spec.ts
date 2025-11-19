import { expect } from 'chai';
import { Chance } from 'chance';
import * as mongoose from 'mongoose';

import { getRoles } from './';

const chance = new Chance();

const Schema = new mongoose.Schema({ userId: mongoose.Schema.Types.ObjectId });
type Document = mongoose.Document & mongoose.InferSchemaType<typeof Schema>;
const Model = mongoose.model<Document>(chance.hash(), Schema);

describe('get-roles', function () {
  it('returns the matching roles', function () {
    const _id = new mongoose.Types.ObjectId();
    const permissions = {
      roles: {
        admin: { 'authorization.roles': 'Admin' },
        default: {},
        owner: { 'record.userId': { $eq: { $ref: 'user._id' } } },
      },
    };
    const references = {
      authorization: { roles: ['Admin'] },
      record: new Model({ userId: _id }),
      user: { _id: _id.toHexString() },
    };
    const result = getRoles(permissions, references);

    expect(result).to.eql(['admin', 'default', 'owner']);
  });

  it('returns an empty array when nothing matches', function () {
    const _id = new mongoose.Types.ObjectId();
    const permissions = {
      roles: {
        admin: { 'authorization.roles': 'Admin' },
        owner: { 'record.userId': { $eq: { $ref: 'user._id' } } },
      },
    };
    const references = {
      record: new Model({ userId: new mongoose.Types.ObjectId() }),
      user: { _id: _id.toHexString() },
    };
    const result = getRoles(permissions, references);

    expect(result).to.eql([]);
  });
});
