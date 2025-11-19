import { expect, use } from 'chai';
import chaiAsPromised from 'chai-as-promised';
import { Chance } from 'chance';
import * as mongoose from 'mongoose';

import { PermissionError } from '../types';
import { count } from './';

const chance = new Chance();
use(chaiAsPromised);

const Schema = new mongoose.Schema({ name: String });
type Document = mongoose.Document & mongoose.InferSchemaType<typeof Schema>;
const Model = mongoose.model<Document>(chance.hash(), Schema);

const permissions = {
  find: {
    admin: {},
  },
  roles: {
    admin: { 'authorization.roles': 'Admin' },
    default: {},
  },
};

describe('count', function () {
  beforeEach(async function () {
    await Model.create({ name: chance.hash() });
    await Model.create({ name: null });
  });

  afterEach(async function () {
    await Model.deleteMany();
  });

  context('when user is an admin', function () {
    it('returns all the records', async function () {
      const context = {
        credentials: { authorization: { roles: ['Admin'] } },
        Model,
        options: permissions,
      };

      const results = await count(context, {}, {});

      expect(results).to.eql(2);
    });
  });

  context('when user is not an admin', function () {
    it('throws an error', async function () {
      const context = {
        credentials: { authorization: { roles: [] } },
        Model,
        options: permissions,
      };

      const promise = count(context, {}, {});

      return expect(promise).to.be.rejectedWith(PermissionError);
    });
  });
});
