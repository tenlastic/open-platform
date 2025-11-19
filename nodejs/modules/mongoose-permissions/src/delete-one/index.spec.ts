import { expect, use } from 'chai';
import chaiAsPromised from 'chai-as-promised';
import { Chance } from 'chance';
import * as mongoose from 'mongoose';

import { PermissionError } from '../types';
import { deleteOne } from './';

const chance = new Chance();
use(chaiAsPromised);

const Schema = new mongoose.Schema({ name: String });
type Document = mongoose.Document<mongoose.Types.ObjectId> &
  mongoose.InferSchemaType<typeof Schema>;
const Model = mongoose.model<Document>(chance.hash(), Schema);

const permissions = {
  delete: {
    admin: true,
  },
  roles: {
    admin: { 'authorization.roles': 'Admin' },
    default: {},
  },
};

describe('delete-one', function () {
  let record: Document;

  beforeEach(async function () {
    record = await Model.create({ name: chance.hash() });
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

      const results = await deleteOne(context, record);

      expect(results.acknowledged).to.eql(true);
      expect(results.deletedCount).to.eql(1);
    });
  });

  context('when user is not an admin', function () {
    it('throws an error', async function () {
      const context = {
        credentials: { authorization: { roles: [] } },
        Model,
        options: permissions,
      };

      const promise = deleteOne(context, record);

      return expect(promise).to.be.rejectedWith(PermissionError);
    });
  });
});
