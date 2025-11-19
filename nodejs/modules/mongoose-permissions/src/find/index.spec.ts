import { expect, use } from 'chai';
import chaiAsPromised from 'chai-as-promised';
import { Chance } from 'chance';
import * as mongoose from 'mongoose';

import { IUser, PermissionError } from '../types';
import { find } from './';

const chance = new Chance();
use(chaiAsPromised);

const Schema = new mongoose.Schema({ name: String, userId: mongoose.Schema.Types.ObjectId });
type Document = mongoose.Document & mongoose.InferSchemaType<typeof Schema>;
const Model = mongoose.model<Document>(chance.hash(), Schema);

describe('find', function () {
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

      const results = await find(context, {}, {});

      expect(results.length).to.eql(2);
      expect(results[0].name).to.eql(names[0]);
      expect(results[0].userId).to.not.exist;
      expect(results[1].name).to.eql(names[1]);
      expect(results[1].userId.toHexString()).to.eql(user._id);
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

      const results = await find(context, {}, {});

      expect(results.length).to.eql(1);
      expect(results[0].name).to.eql(names[1]);
      expect(results[0].userId.toHexString()).to.eql(user._id);
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

      const promise = find(context, {}, {});

      expect(promise).to.be.rejectedWith(PermissionError);
    });
  });
});
