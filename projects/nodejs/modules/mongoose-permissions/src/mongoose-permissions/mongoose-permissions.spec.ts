import * as chai from 'chai';
import * as chaiAsPromised from 'chai-as-promised';
import { Chance } from 'chance';
import * as sinon from 'sinon';
import * as sinonChai from 'sinon-chai';

import { Example, ExampleDocument, ExamplePermissions } from '../example-model';
import { PermissionError } from './mongoose-permissions';

const chance = new Chance();
const expect = chai.expect;

chai.use(chaiAsPromised);
chai.use(sinonChai);

describe('permissions', function() {
  let admin: any;
  let sandbox: sinon.SinonSandbox;
  let user: any;

  beforeEach(async function() {
    sandbox = sinon.createSandbox();

    admin = { roles: ['Admin'] };
    user = { roles: [] };
  });

  afterEach(function() {
    sandbox.restore();
  });

  describe('count()', function() {
    beforeEach(async function() {
      await Example.mock({ name: chance.hash() });
      await Example.mock({ name: null });
    });

    context('when user is an admin', function() {
      it('returns all the records', async function() {
        const results = await ExamplePermissions.count({}, {}, admin);

        expect(results).to.eql(2);
      });
    });

    context('when user is not an admin', function() {
      it('throws an error', async function() {
        const promise = ExamplePermissions.count({}, {}, user);

        return expect(promise).to.be.rejectedWith(PermissionError);
      });
    });
  });

  describe('create()', function() {
    context('when user is an admin', function() {
      it('creates a new record', async function() {
        const params = {
          customProperties: {
            age: chance.integer(),
            name: chance.hash(),
          },
          name: chance.hash(),
        };

        const record = await ExamplePermissions.create(params, {}, admin);

        expect(record._id).to.exist;
        expect(record.createdAt).to.exist;
        expect(record.customProperties.age).to.eql(params.customProperties.age);
        expect(record.customProperties.name).to.not.exist;
        expect(record.name).to.eql(params.name);
        expect(record.updatedAt).to.exist;
      });
    });

    context('when user is not an admin', function() {
      it('throws an error', async function() {
        const params = { name: chance.hash() };

        const promise = ExamplePermissions.create(params, {}, user);

        return expect(promise).to.be.rejectedWith(PermissionError);
      });
    });
  });

  describe('delete()', function() {
    let record: ExampleDocument;

    beforeEach(async function() {
      record = await Example.mock();
    });

    context('when the user is an admin', function() {
      it('returns the user', async function() {
        const results = await ExamplePermissions.delete(record, admin);

        expect(results._id.toString()).to.eql(record._id.toString());
        expect(results.createdAt).to.eql(record.createdAt);
        expect(results.name).to.eql(record.name);
        expect(results.updatedAt).to.exist;
      });
    });

    context('when the user is not an admin', function() {
      it('throws an error', async function() {
        const promise = ExamplePermissions.delete(record, user);

        return expect(promise).to.be.rejectedWith(PermissionError);
      });
    });
  });

  describe('find()', function() {
    beforeEach(async function() {
      await Example.mock({ name: chance.hash() });
    });

    context('when user is an admin', function() {
      it('returns all the records', async function() {
        const results = await ExamplePermissions.find({}, {}, admin);

        expect(results.length).to.eql(1);
      });
    });

    context('when user is not an admin', function() {
      it('throws an error', async function() {
        const promise = ExamplePermissions.find({}, {}, user);

        return expect(promise).to.be.rejectedWith(PermissionError);
      });
    });
  });

  describe('read()', function() {
    let record: ExampleDocument;

    beforeEach(async function() {
      record = await Example.mock({
        customProperties: {
          age: chance.integer(),
          name: chance.hash(),
        },
      });
    });

    context('when user is an admin', function() {
      it('returns the record', async function() {
        record = await ExamplePermissions.read(record, admin);

        expect(record._id).to.exist;
        expect(record.createdAt).to.exist;
        expect(record.customProperties.age).to.exist;
        expect(record.customProperties.name).to.not.exist;
        expect(record.name).to.exist;
        expect(record.updatedAt).to.exist;
      });
    });

    context('when user is not an admin', function() {
      it('returns the record', async function() {
        record = await ExamplePermissions.read(record, user);

        expect(record._id).to.exist;
        expect(record.createdAt).to.exist;
        expect(record.name).to.not.exist;
        expect(record.updatedAt).to.exist;
      });
    });
  });

  describe('update()', function() {
    let record: ExampleDocument;

    beforeEach(async function() {
      record = await Example.mock();
    });

    context('when the user is an admin', function() {
      it('updates and returns the record', async function() {
        const params = {
          customProperties: {
            age: chance.integer(),
            name: chance.hash(),
          },
          name: chance.hash(),
        };

        record = await ExamplePermissions.update(record, params, {}, admin);

        expect(record._id.toString()).to.eql(record._id.toString());
        expect(record.createdAt).to.exist;
        expect(record.customProperties.age).to.eql(params.customProperties.age);
        expect(record.customProperties.name).to.not.exist;
        expect(record.name).to.eql(params.name);
        expect(record.updatedAt).to.exist;
      });
    });

    context('when the user is not an admin', function() {
      it('throws an error', async function() {
        const params = { name: chance.hash() };

        const promise = ExamplePermissions.update(record, params, {}, user);

        return expect(promise).to.be.rejectedWith(PermissionError);
      });
    });
  });

  describe('where()', function() {
    context('when the user is an admin', function() {
      it('returns a valid where query', async function() {
        const query = await ExamplePermissions.where({}, admin);

        expect(query).to.be.empty;
      });
    });

    context('when the user is not an admin', function() {
      it('returns null', async function() {
        const result = await ExamplePermissions.where({}, user);

        expect(result).to.eql(null);
      });
    });
  });

  describe(`['filterObject']()`, function() {
    it('handles primitive values', function() {
      const permissions = ['age', 'name'];
      const record = { age: 5, name: 'name', state: 'NJ' };

      const result: any = ExamplePermissions['filterObject'](record, permissions);

      expect(result.age).to.eql(5);
      expect(result.name).to.eql('name');
      expect(result.state).to.not.exist;
    });

    it('handles nested objects', function() {
      const permissions = [
        'jsonSchema.properties.age',
        'jsonSchema.properties.name.*',
        'jsonSchema.properties.state',
        'jsonSchema.type',
      ];
      const record = {
        jsonSchema: {
          properties: {
            age: {
              type: 'string',
            },
            country: {
              type: 'object',
            },
            name: {
              properties: {},
              type: 'object',
            },
            state: {},
          },
          type: 'object',
        },
      };

      const result: any = ExamplePermissions['filterObject'](record, permissions);

      expect(result.jsonSchema.properties.age).to.eql({});
      expect(result.jsonSchema.properties.country).to.not.exist;
      expect(result.jsonSchema.properties.name).to.eql({ properties: {}, type: 'object' });
      expect(result.jsonSchema.properties.state).to.eql({});
      expect(result.jsonSchema.type).to.eql('object');
    });
  });

  describe(`['filterRecord']()`, function() {
    it('handles primitive values', function() {
      const permissions = ['age', 'name'];
      const record = { age: 5, name: 'name', state: 'NJ' };

      const result: any = ExamplePermissions['filterRecord'](record as any, permissions);

      expect(result.age).to.eql(5);
      expect(result.name).to.eql('name');
      expect(result.state).to.not.exist;
    });

    it('handles nested objects', function() {
      const permissions = [
        'jsonSchema.properties.age',
        'jsonSchema.properties.name.*',
        'jsonSchema.properties.state',
        'jsonSchema.type',
      ];
      const record = {
        jsonSchema: {
          properties: {
            age: {
              type: 'string',
            },
            country: {
              type: 'object',
            },
            name: {
              properties: {},
              type: 'object',
            },
            state: {},
          },
          type: 'object',
        },
      };

      const result: any = ExamplePermissions['filterRecord'](record as any, permissions);

      expect(result.jsonSchema.properties.age).to.eql({});
      expect(result.jsonSchema.properties.country).to.not.exist;
      expect(result.jsonSchema.properties.name).to.eql({ properties: {}, type: 'object' });
      expect(result.jsonSchema.properties.state).to.eql({});
      expect(result.jsonSchema.type).to.eql('object');
    });
  });
});
