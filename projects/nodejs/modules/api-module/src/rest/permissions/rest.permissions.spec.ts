import * as chai from 'chai';
import * as chaiAsPromised from 'chai-as-promised';
import { Chance } from 'chance';
import * as sinon from 'sinon';
import * as sinonChai from 'sinon-chai';

import { Rest, RestDocument } from './rest.model';
import { RestPermissionsMock } from './rest.permissions.mock';

const chance = new Chance();
const expect = chai.expect;
const permissions = new RestPermissionsMock();

chai.use(chaiAsPromised);
chai.use(sinonChai);

describe('rest/permissions', function() {
  let admin: any;
  let sandbox: sinon.SinonSandbox;
  let user: any;

  beforeEach(async function() {
    sandbox = sinon.createSandbox();

    admin = { level: 1 };
    user = { level: 0 };
  });

  afterEach(function() {
    sandbox.restore();
  });

  describe('count()', function() {
    beforeEach(async function() {
      await Rest.mock({ name: chance.hash() });
      await Rest.mock({ name: null });
    });

    context('when user is an admin', function() {
      it('returns all the records', async function() {
        const results = await permissions.count({}, {}, admin);

        expect(results).to.eql(2);
      });
    });

    context('when user is not an admin', function() {
      it('returns accessible records', async function() {
        const results = await permissions.count({}, {}, user);

        expect(results).to.eql(1);
      });
    });
  });

  describe('create()', function() {
    context('when user is an admin', function() {
      it('creates a new record', async function() {
        const params = {
          name: chance.hash(),
        };

        const record = await permissions.create(params, {}, admin);

        expect(record._id).to.exist;
        expect(record.createdAt).to.exist;
        expect(record.name).to.eql(params.name);
        expect(record.updatedAt).to.exist;
      });
    });

    context('when user is not an admin', function() {
      it('returns an error', async function() {
        const params = {
          name: chance.hash(),
        };

        const promise = permissions.create(params, {}, user);

        return expect(promise).to.be.rejectedWith(
          'User does not have permission to perform this action.',
        );
      });
    });
  });

  describe('find()', function() {
    beforeEach(async function() {
      await Rest.mock({ name: chance.hash() });
    });

    context('when user is an admin', function() {
      it('returns all the records', async function() {
        const results = await permissions.find({}, {}, admin);

        expect(results.length).to.eql(1);
      });
    });

    context('when user is not an admin', function() {
      it('returns accessible records', async function() {
        const results = await permissions.find({}, {}, user);

        expect(results.length).to.eql(1);
      });
    });
  });

  describe('read()', function() {
    let record: RestDocument;

    beforeEach(async function() {
      record = await Rest.mock();
    });

    context('when user is an admin', function() {
      it('returns the record', async function() {
        record = await permissions.read(record, admin);

        expect(record._id).to.exist;
        expect(record.createdAt).to.exist;
        expect(record.name).to.exist;
        expect(record.updatedAt).to.exist;
      });
    });

    context('when user is not an admin', function() {
      it('returns the record', async function() {
        record = await permissions.read(record, user);

        expect(record._id).to.exist;
        expect(record.createdAt).to.exist;
        expect(record.name).to.not.exist;
        expect(record.updatedAt).to.exist;
      });
    });
  });

  describe('remove()', function() {
    let record: RestDocument;

    beforeEach(async function() {
      record = await Rest.mock();
    });

    context('when the user is an admin', function() {
      it('returns the user', async function() {
        const results = await permissions.remove(record, admin);

        expect(results).to.eql(record);
      });
    });

    context('when the user is not an admin', function() {
      it('returns an error', async function() {
        const promise = permissions.remove(record, user);

        return expect(promise).to.be.rejectedWith(
          'User does not have permission to perform this action.',
        );
      });
    });
  });

  describe('update()', function() {
    let record: RestDocument;

    beforeEach(async function() {
      record = await Rest.mock();
    });

    context('when the user is an admin', function() {
      it('updates and returns the record', async function() {
        const params = {
          name: chance.hash(),
        };

        record = await permissions.update(record, params, {}, admin);

        expect(record._id).to.exist;
        expect(record.createdAt).to.exist;
        expect(record.name).to.eql(params.name);
        expect(record.updatedAt).to.exist;
      });
    });

    context('when the user is not an admin', function() {
      it('returns an error', async function() {
        const params = {
          name: chance.hash(),
        };

        const promise = permissions.update(record, params, {}, user);

        return expect(promise).to.be.rejectedWith(
          'User does not have permission to perform this action.',
        );
      });
    });
  });

  describe('where()', function() {
    context('when the user is an admin', function() {
      it('returns a valid where query', async function() {
        const query = await permissions.where({}, admin);

        expect(query).to.be.empty;
      });
    });

    context('when the user is not an admin', function() {
      it('returns a valid where query', async function() {
        const query = await permissions.where({}, user);

        expect(query.name).to.eql({ $ne: null });
      });
    });
  });
});
