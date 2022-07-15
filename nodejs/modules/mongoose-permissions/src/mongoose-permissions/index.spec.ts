import { expect, use } from 'chai';
import * as chaiAsPromised from 'chai-as-promised';
import { Chance } from 'chance';
import mongoose from 'mongoose';
import * as sinon from 'sinon';
import * as sinonChai from 'sinon-chai';

import { Example, ExampleDocument, ExamplePermissions } from '../models';
import { IOptions, MongoosePermissions, PermissionError } from './';

const chance = new Chance();
use(chaiAsPromised);
use(sinonChai);

describe('permissions', function () {
  let admin: any;
  let sandbox: sinon.SinonSandbox;
  let user: any;

  beforeEach(async function () {
    sandbox = sinon.createSandbox();

    admin = { roles: ['Admin'] };
    user = { roles: [] };
  });

  afterEach(function () {
    sandbox.restore();
  });

  describe('count()', function () {
    beforeEach(async function () {
      await Example.mock({ name: chance.hash() });
      await Example.mock({ name: null });
    });

    context('when user is an admin', function () {
      it('returns all the records', async function () {
        const results = await ExamplePermissions.count({ user: admin }, {}, {});

        expect(results).to.eql(2);
      });
    });

    context('when user is not an admin', function () {
      it('throws an error', async function () {
        const promise = ExamplePermissions.count({ user }, {}, {});

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

        const record = await ExamplePermissions.create({ user: admin }, {}, params);

        expect(record._id).to.exist;
        expect(record.createdAt).to.exist;
        expect(record.properties.age).to.eql(params.properties.age);
        expect(record.properties.name).to.not.exist;
        expect(record.name).to.eql(params.name);
        expect(record.updatedAt).to.exist;
      });
    });

    context('when user is not an admin', function () {
      it('throws an error', async function () {
        const params = { name: chance.hash() };

        const promise = ExamplePermissions.create({ user }, {}, params);

        return expect(promise).to.be.rejectedWith(PermissionError);
      });
    });
  });

  describe('delete()', function () {
    let record: ExampleDocument;

    beforeEach(async function () {
      record = await Example.mock();
    });

    context('when the user is an admin', function () {
      it('returns the user', async function () {
        const results = await ExamplePermissions.delete({ user: admin }, record);

        expect(results._id.toString()).to.eql(record._id.toString());
        expect(results.createdAt).to.eql(record.createdAt);
        expect(results.name).to.eql(record.name);
        expect(results.updatedAt).to.exist;
      });
    });

    context('when the user is not an admin', function () {
      it('throws an error', async function () {
        const promise = ExamplePermissions.delete({ user }, record);

        return expect(promise).to.be.rejectedWith(PermissionError);
      });
    });
  });

  describe('find()', function () {
    beforeEach(async function () {
      await Example.mock({ name: chance.hash() });
    });

    context('when user is an admin', function () {
      it('returns all the records', async function () {
        const results = await ExamplePermissions.find({ user: admin }, {}, {});

        expect(results.length).to.eql(1);
      });
    });

    context('when user is not an admin', function () {
      it('throws an error', async function () {
        const promise = ExamplePermissions.find({ user }, {}, {});

        return expect(promise).to.be.rejectedWith(PermissionError);
      });
    });
  });

  describe('read()', function () {
    let record: ExampleDocument;

    beforeEach(async function () {
      record = await Example.mock({
        properties: {
          age: chance.integer(),
          name: chance.hash(),
        },
      });
    });

    context('when user is an admin', function () {
      it('returns the record', async function () {
        const result = await ExamplePermissions.read({ user: admin }, record);

        expect(result._id).to.exist;
        expect(result.createdAt).to.exist;
        expect(result.properties.age).to.exist;
        expect(result.properties.name).to.exist;
        expect(result.name).to.exist;
        expect(result.updatedAt).to.exist;
      });
    });

    context('when user is not an admin', function () {
      it('returns the record', async function () {
        const result = await ExamplePermissions.read({ user }, record);

        expect(result._id).to.exist;
        expect(result.createdAt).to.exist;
        expect(result.name).to.not.exist;
        expect(result.updatedAt).to.exist;
      });
    });
  });

  describe('update()', function () {
    let record: ExampleDocument;

    beforeEach(async function () {
      record = await Example.mock({
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

        record = await ExamplePermissions.update({ user: admin }, {}, params, record, [
          'properties',
        ]);

        expect(record._id.toString()).to.eql(record._id.toString());
        expect(record.createdAt).to.exist;
        expect(record.jsonSchema.properties.age).to.eql(params.jsonSchema.properties.age);
        expect(record.jsonSchema.properties.fruits).to.to.eql(params.jsonSchema.properties.fruits);
        expect(record.jsonSchema.properties.name).to.not.exist;
        expect(record.properties.age).to.eql(params.properties.age);
        expect(record.properties.name).to.exist;
        expect(record.name).to.eql(params.name);
        expect(record.updatedAt).to.exist;
        expect(record.urls.length).to.eql(1);
        expect(record.urls).to.eql(params.urls);
      });
    });

    context('when the user is not an admin', function () {
      it('throws an error', async function () {
        const params = { name: chance.hash() };

        const promise = ExamplePermissions.update({ user }, {}, params, record);

        return expect(promise).to.be.rejectedWith(PermissionError);
      });
    });
  });

  describe('where()', function () {
    context('when the user is an admin', function () {
      it('returns a valid where query', async function () {
        const query = await ExamplePermissions.where({ user: admin }, {});

        expect(query).to.be.empty;
      });
    });

    context('when the user is not an admin', function () {
      it('returns null', async function () {
        const result = await ExamplePermissions.where({ user }, {});

        expect(result).to.eql(null);
      });
    });
  });

  describe(`['getRole']()`, function () {
    let options: IOptions;
    let permissions: MongoosePermissions<any>;

    beforeEach(function () {
      options = {
        roles: [
          {
            name: 'admin',
            query: { 'user.roles': { $eq: 'Admin' } },
          },
          {
            name: 'owner',
            query: { 'record.userId': { $eq: { $ref: 'user._id' } } },
          },
        ],
      };
      permissions = new MongoosePermissions(null, options);
    });

    it('returns the first role', function () {
      const result = permissions['getRole']({ user: { roles: ['Admin'] } });

      expect(result).to.eql('admin');
    });

    it('returns the second role', function () {
      const _id = new mongoose.Types.ObjectId();
      const result = permissions['getRole']({ record: { userId: _id }, user: { _id } });

      expect(result).to.eql('owner');
    });

    it('returns default', function () {
      const _id = new mongoose.Types.ObjectId();
      const result = permissions['getRole']({
        record: { userId: new mongoose.Types.ObjectId() },
        user: { _id },
      });

      expect(result).to.eql('default');
    });
  });
});
