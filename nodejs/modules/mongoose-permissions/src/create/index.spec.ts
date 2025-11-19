import { expect, use } from 'chai';
import chaiAsPromised from 'chai-as-promised';
import { Chance } from 'chance';
import * as mongoose from 'mongoose';

import { PermissionError } from '../types';
import { create } from './';

const chance = new Chance();
use(chaiAsPromised);

const Schema = new mongoose.Schema({
  properties: { merge: true, type: mongoose.Schema.Types.Mixed },
  name: String,
  userId: mongoose.Schema.Types.ObjectId,
});
type Document = mongoose.Document & mongoose.InferSchemaType<typeof Schema>;
const Model = mongoose.model<Document>(chance.hash(), Schema);

const permissions = {
  create: {
    admin: ['properties.age', 'name', 'userId'],
    owner: ['name'],
  },
  roles: {
    admin: { 'authorization.roles': 'Admin' },
    default: {},
    owner: { 'record.userId': { $ref: 'user._id' } },
  },
};

describe('create', function () {
  afterEach(async function () {
    await Model.deleteMany();
  });

  context('when user is an admin', function () {
    it('creates a new record', async function () {
      const context = {
        credentials: { authorization: { roles: ['Admin'] } },
        Model,
        options: permissions,
      };
      const baseParameters = {
        name: chance.hash(),
        properties: {
          age: chance.integer(),
          name: chance.hash(),
        },
      };

      const record = await create(context, baseParameters);

      expect(record._id).to.exist;
      expect(record.name).to.eql(baseParameters.name);
      expect(record.properties.age).to.eql(baseParameters.properties.age);
      expect(record.properties.name).to.not.exist;
    });
  });

  context('when user is an owner', function () {
    it('creates a new record', async function () {
      const context = {
        credentials: {
          authorization: { roles: [] },
          user: { _id: new mongoose.Types.ObjectId().toHexString() },
        },
        Model,
        options: permissions,
      };
      const baseParameters = {
        name: chance.hash(),
        properties: {
          age: chance.integer(),
          name: chance.hash(),
        },
      };
      const overlayParameters = {
        userId: new mongoose.Types.ObjectId(context.credentials.user._id),
      };

      const record = await create(context, baseParameters, overlayParameters);

      expect(record._id).to.exist;
      expect(record.name).to.eql(baseParameters.name);
      expect(record.properties).to.not.exist;
      expect(record.userId.toHexString()).to.eql(overlayParameters.userId.toHexString());
    });
  });

  context('when user is not an admin or owner', function () {
    it('throws an error', async function () {
      const context = {
        credentials: { authorization: { roles: [] } },
        Model,
        options: permissions,
      };
      const baseParameters = {
        name: chance.hash(),
        properties: {
          age: chance.integer(),
          name: chance.hash(),
        },
      };

      const promise = create(context, baseParameters);

      return expect(promise).to.be.rejectedWith(PermissionError);
    });
  });
});
