import { expect, use } from 'chai';
import chaiAsPromised from 'chai-as-promised';
import { Chance } from 'chance';
import * as mongoose from 'mongoose';

import { IUser, PermissionError } from '../types';
import { findOne } from './';

const chance = new Chance();
use(chaiAsPromised);

const Schema = new mongoose.Schema({ name: String, userId: mongoose.Schema.Types.ObjectId });
type Document = mongoose.Document & mongoose.InferSchemaType<typeof Schema>;
const Model = mongoose.model<Document>(chance.hash(), Schema);

describe('find-one', function () {
  let names: string[];
  let user: IUser;

  beforeEach(async function () {
    names = [chance.hash(), chance.hash()];
    user = { _id: new mongoose.Types.ObjectId().toHexString() };

    await Model.create({ name: names[0] });
    await Model.create({ name: names[1], userId: user._id });
  });

  afterEach(async function () {
    await Model.deleteMany();
  });

  context('when user is an admin', function () {
    it('returns all the records', async function () {
      const context = {
        credentials: { authorization: { roles: ['Admin'] } },
        Model,
        options: {
          find: {
            admin: {},
          },
          read: {
            admin: ['name', 'userId'],
          },
          roles: {
            admin: { 'authorization.roles': 'Admin' },
          },
        },
      };

      const results = await findOne(context, {}, {});

      expect(results.name).to.eql(names[0]);
      expect(results.userId).to.not.exist;
    });
  });

  context('when user is an owner', function () {
    it(`returns the owner's records`, async function () {
      const context = {
        credentials: { authorization: { roles: [] }, user },
        Model,
        options: {
          find: {
            admin: {},
            default: { userId: { $ref: 'user._id' } },
          },
          roles: {
            admin: { 'authorization.roles': 'Admin' },
            default: {},
          },
        },
      };

      const results = await findOne(context, {}, {});

      expect(results.name).to.eql(names[1]);
      expect(results.userId.toHexString()).to.eql(user._id);
    });
  });

  context('when user is not an admin or owner', function () {
    it('throws an error', async function () {
      const context = {
        credentials: { authorization: { roles: [] }, user },
        Model,
        options: {
          find: {
            admin: {},
          },
          roles: {
            admin: { 'authorization.roles': 'Admin' },
            default: {},
          },
        },
      };

      const promise = findOne(context, {}, {});

      expect(promise).to.be.rejectedWith(PermissionError);
    });
  });
});
