import { expect } from 'chai';
import { Chance } from 'chance';
import * as mongoose from 'mongoose';

import { getFieldPermissions } from './';

const chance = new Chance();

const name = chance.hash();
const Schema = new mongoose.Schema({
  properties: { merge: true, type: mongoose.Schema.Types.Mixed },
  name: String,
  parentId: mongoose.Schema.Types.ObjectId,
  userId: mongoose.Schema.Types.ObjectId,
});
Schema.virtual('parent', { foreignField: '_id', localField: 'parentId', ref: name });
type Document = mongoose.Document & mongoose.InferSchemaType<typeof Schema>;
const Model = mongoose.model<Document>(name, Schema);

const permissions = {
  create: {
    admin: ['properties.age', 'name', 'userId'],
    owner: ['name', 'userId'],
    parent: ['userId'],
  },
  populate: [{ path: 'parent' }],
  roles: {
    admin: { 'authorization.roles': 'Admin' },
    default: {},
    owner: { 'record.userId': { $ref: 'user._id' } },
    parent: { 'record.parent.userId': { $ref: 'user._id' } },
  },
};

describe('get-field-permissions', function () {
  afterEach(async function () {
    await Model.deleteMany();
  });

  context('when user is an admin', function () {
    it(`returns the admin's permission set`, async function () {
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
      const record = new Model(baseParameters);

      const fields = await getFieldPermissions(context, 'create', record);

      expect(fields).to.eql(permissions.create.admin);
    });
  });

  context('when user is an owner', function () {
    it(`returns the owner's permission set`, async function () {
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
        userId: context.credentials.user._id,
      };
      const record = new Model(baseParameters);

      const fields = await getFieldPermissions(context, 'create', record);

      expect(fields).to.eql(permissions.create.owner);
    });
  });

  context('when user is a parent', function () {
    it(`returns the parent's permission set`, async function () {
      const context = {
        credentials: {
          authorization: { roles: [] },
          user: { _id: new mongoose.Types.ObjectId().toHexString() },
        },
        Model,
        options: permissions,
      };

      const parent = await Model.create({
        name: chance.hash(),
        properties: {
          age: chance.integer(),
          name: chance.hash(),
        },
        userId: context.credentials.user._id,
      });
      const record = new Model({
        name: chance.hash(),
        parentId: parent._id,
        properties: {
          age: chance.integer(),
          name: chance.hash(),
        },
        userId: new mongoose.Types.ObjectId(),
      });

      const fields = await getFieldPermissions(context, 'create', record);

      expect(fields).to.eql(permissions.create.parent);
    });
  });

  context('when user is not an admin, owner, or parent', function () {
    it('returns an empty array', async function () {
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
      const record = new Model(baseParameters);

      const fields = await getFieldPermissions(context, 'create', record);

      expect(fields).to.eql([]);
    });
  });
});
