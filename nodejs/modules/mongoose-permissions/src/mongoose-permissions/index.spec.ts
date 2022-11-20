import { expect, use } from 'chai';
import * as chaiAsPromised from 'chai-as-promised';
import { Chance } from 'chance';
import mongoose from 'mongoose';
import * as sinon from 'sinon';
import * as sinonChai from 'sinon-chai';

import { IOptions, MongoosePermissions, PermissionError } from './';

interface Document extends mongoose.Document {
  jsonSchema: any;
  properties: any;
  name: string;
  parentId: mongoose.Types.ObjectId;
  urls: string[];
  userId: mongoose.Types.ObjectId;
}

const chance = new Chance();
use(chaiAsPromised);
use(sinonChai);

const schema = new mongoose.Schema<Document>({
  jsonSchema: mongoose.Schema.Types.Mixed,
  properties: { merge: true, type: mongoose.Schema.Types.Mixed },
  name: String,
  parentId: mongoose.Schema.Types.ObjectId,
  urls: [String],
  userId: mongoose.Schema.Types.ObjectId,
});
schema.virtual('parent', {
  foreignField: '_id',
  justOne: true,
  localField: 'parentId',
  ref: 'mongoose-permissions',
});
const Model = mongoose.model('mongoose-permissions', schema);
export const Permissions = new MongoosePermissions<Document>(Model, {
  create: {
    admin: ['properties.age', 'name', 'urls'],
  },
  delete: {
    admin: true,
  },
  find: {
    admin: {},
  },
  populate: [{ path: 'parent' }],
  read: {
    admin: ['_id', 'jsonSchema.*', 'properties.age', 'properties.name', 'name', 'urls'],
    default: ['_id'],
  },
  roles: {
    admin: { 'user.roles': 'Admin' },
    default: {},
    owner: { 'record.userId': { $ref: 'user._id' } },
  },
  update: {
    admin: ['jsonSchema.*', 'properties.age', 'name', 'urls'],
  },
});

describe('mongoose-permissions', function () {
  let admin: any;
  let sandbox: sinon.SinonSandbox;
  let user: any;

  beforeEach(async function () {
    sandbox = sinon.createSandbox();

    admin = { roles: ['Admin'] };
    user = { roles: [] };

    await Model.deleteMany();
  });

  afterEach(function () {
    sandbox.restore();
  });

  describe('count()', function () {
    beforeEach(async function () {
      await Model.create({ name: chance.hash() });
      await Model.create({ name: null });
    });

    context('when user is an admin', function () {
      it('returns all the records', async function () {
        const results = await Permissions.count({ user: admin }, {}, {});

        expect(results).to.eql(2);
      });
    });

    context('when user is not an admin', function () {
      it('throws an error', async function () {
        const promise = Permissions.count({ user }, {}, {});

        return expect(promise).to.be.rejectedWith(PermissionError);
      });
    });
  });

  describe('create()', function () {
    context('when user is an admin', function () {
      it('creates a new record', async function () {
        const params = {
          name: chance.hash(),
          properties: {
            age: chance.integer(),
            name: chance.hash(),
          },
        };

        const record = await Permissions.create({ user: admin }, {}, params);

        expect(record._id).to.exist;
        expect(record.properties.age).to.eql(params.properties.age);
        expect(record.properties.name).to.not.exist;
        expect(record.name).to.eql(params.name);
      });
    });

    context('when user is not an admin', function () {
      it('throws an error', async function () {
        const params = { name: chance.hash() };

        const promise = Permissions.create({ user }, {}, params);

        return expect(promise).to.be.rejectedWith(PermissionError);
      });
    });
  });

  describe('delete()', function () {
    let record: Document;

    beforeEach(async function () {
      record = await Model.create({});
    });

    context('when the user is an admin', function () {
      it('returns the user', async function () {
        const results = await Permissions.delete({ user: admin }, record);

        expect(results._id.toString()).to.eql(record._id.toString());
        expect(results.name).to.eql(record.name);
      });
    });

    context('when the user is not an admin', function () {
      it('throws an error', async function () {
        const promise = Permissions.delete({ user }, record);

        return expect(promise).to.be.rejectedWith(PermissionError);
      });
    });
  });

  describe('find()', function () {
    beforeEach(async function () {
      await Model.create({ name: chance.hash() });
    });

    context('when user is an admin', function () {
      it('returns all the records', async function () {
        const results = await Permissions.find({ user: admin }, {}, {});

        expect(results.length).to.eql(1);
      });
    });

    context('when user is not an admin', function () {
      it('throws an error', async function () {
        const promise = Permissions.find({ user }, {}, {});

        return expect(promise).to.be.rejectedWith(PermissionError);
      });
    });
  });

  describe('read()', function () {
    let record: Document;

    beforeEach(async function () {
      record = await Model.create({
        properties: {
          age: chance.integer(),
          name: chance.hash(),
        },
      });
    });

    context('when user is an admin', function () {
      it('returns the record', async function () {
        const result = await Permissions.read({ user: admin }, record);

        expect(result._id).to.exist;
        expect(result.properties.age).to.exist;
        expect(result.properties.name).to.exist;
      });
    });

    context('when user is not an admin', function () {
      it('returns the record', async function () {
        const result = await Permissions.read({ user }, record);

        expect(result._id).to.exist;
        expect(result.name).to.not.exist;
      });
    });
  });

  describe('update()', function () {
    let record: Document;

    beforeEach(async function () {
      record = await Model.create({
        jsonSchema: {
          properties: {
            fruits: ['apple', 'banana'],
            name: {
              type: 'string',
            },
          },
          type: 'object',
        },
        properties: {
          name: chance.hash(),
        },
        urls: [chance.url(), chance.url()],
      });
    });

    context('when the user is an admin', function () {
      it('updates and returns the record', async function () {
        const params = {
          jsonSchema: {
            properties: {
              age: {
                type: 'number',
              },
              fruits: ['cranberry'],
            },
            type: 'object',
          },
          name: chance.hash(),
          properties: {
            age: chance.integer(),
            name: chance.hash(),
          },
          urls: [chance.url()],
        };

        record = await Permissions.update({ user: admin }, {}, params, record);

        expect(record._id.toString()).to.eql(record._id.toString());
        expect(record.jsonSchema.properties.age).to.eql(params.jsonSchema.properties.age);
        expect(record.jsonSchema.properties.fruits).to.to.eql(params.jsonSchema.properties.fruits);
        expect(record.jsonSchema.properties.name).to.not.exist;
        expect(record.properties.age).to.eql(params.properties.age);
        expect(record.properties.name).to.exist;
        expect(record.name).to.eql(params.name);
        expect(record.urls.length).to.eql(1);
        expect(record.urls).to.eql(params.urls);
      });
    });

    context('when the user is not an admin', function () {
      it('throws an error', async function () {
        const params = { name: chance.hash() };

        const promise = Permissions.update({ user }, {}, params, record);

        return expect(promise).to.be.rejectedWith(PermissionError);
      });
    });
  });

  describe('where()', function () {
    context('when the user is an admin', function () {
      it('returns a valid where query', async function () {
        const query = await Permissions.where({ user: admin }, {});

        expect(query).to.be.eql({ $and: [{}, {}] });
      });
    });

    context('when the user is not an admin', function () {
      it('returns null', async function () {
        const result = await Permissions.where({ user }, {});

        expect(result).to.eql(null);
      });
    });
  });

  describe(`['getRoles']()`, function () {
    let options: IOptions;
    let permissions: MongoosePermissions<any>;

    beforeEach(function () {
      options = {
        roles: {
          admin: { 'user.roles': { $eq: 'Admin' } },
          default: {},
          owner: { 'record.userId': { $eq: { $ref: 'user._id' } } },
        },
      };
      permissions = new MongoosePermissions(null, options);
    });

    it('returns the matching roles', function () {
      const _id = new mongoose.Types.ObjectId();
      const references = { record: { userId: _id }, user: { _id, roles: ['Admin'] } };
      const result = permissions['getRoles'](references);

      expect(result).to.eql(['admin', 'default', 'owner']);
    });

    it('returns default when nothing matches', function () {
      const _id = new mongoose.Types.ObjectId();
      const references = { record: { userId: new mongoose.Types.ObjectId() }, user: { _id } };
      const result = permissions['getRoles'](references);

      expect(result).to.eql(['default']);
    });
  });
});
