import { expect, use } from 'chai';
import chaiAsPromised from 'chai-as-promised';
import { Chance } from 'chance';
import * as mongoose from 'mongoose';

import { IUser, PermissionError } from '../types';
import { read } from './';

const chance = new Chance();
use(chaiAsPromised);

const Schema = new mongoose.Schema({ name: String, userId: mongoose.Schema.Types.ObjectId });
type Document = mongoose.Document & mongoose.InferSchemaType<typeof Schema>;
const Model = mongoose.model<Document>(chance.hash(), Schema);

describe('read', function () {
  let user: IUser;
  let record: Document;

  beforeEach(async function () {
    user = { _id: new mongoose.Types.ObjectId().toHexString() };

    record = await Model.create({ name: chance.hash(), userId: user._id });
  });

  afterEach(async function () {
    await Model.deleteMany();
  });

  context('when user is an admin', function () {
    it('returns all the fields', async function () {
      const context = {
        credentials: { authorization: { roles: ['Admin'] } },
        Model,
        options: {
          read: {
            admin: ['name', 'userId'],
          },
          roles: {
            admin: { 'authorization.roles': 'Admin' },
          },
        },
      };

      const results = await read(context, record);

      expect(results.name).to.eql(record.name);
      expect(results.userId.toHexString()).to.eql(record.userId.toHexString());
    });
  });

  context('when user is an owner', function () {
    it(`returns the owner's fields`, async function () {
      const context = {
        credentials: { authorization: { roles: [] }, user },
        Model,
        options: {
          read: {
            admin: ['name', 'userId'],
            owner: ['userId'],
          },
          roles: {
            admin: { 'authorization.roles': 'Admin' },
            default: {},
            owner: { 'record.userId': { $ref: 'user._id' } },
          },
        },
      };

      const results = await read(context, record);

      expect(results.name).to.not.exist;
      expect(results.userId.toHexString()).to.eql(record.userId.toHexString());
    });
  });

  context('when user is not an admin or owner', function () {
    it('throws an error', async function () {
      const context = {
        credentials: { authorization: { roles: [] }, user },
        Model,
        options: {
          roles: {
            admin: { 'authorization.roles': 'Admin' },
            default: {},
          },
        },
      };

      const promise = read(context, record);

      expect(promise).to.be.rejectedWith(PermissionError);
    });
  });
});
