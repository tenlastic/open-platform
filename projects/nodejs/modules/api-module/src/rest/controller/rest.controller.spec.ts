import { expect } from 'chai';
import { Chance } from 'chance';

import { Rest, RestDocument } from '../permissions/rest.model';
import { RestPermissionsMock } from '../permissions/rest.permissions.mock';
import { RestController } from './rest.controller';

const chance = new Chance();

const permissions = new RestPermissionsMock();
const controller = new RestController(Rest, permissions);

describe('rest/controller', function() {
  let target: RestDocument;
  let user: any;

  beforeEach(async function() {
    target = await Rest.mock();
    user = { roles: ['Admin'] };
  });

  describe('count()', function() {
    it('returns the number of records matching the criteria', async function() {
      const result = await controller.count({}, user);

      expect(result).to.eql(1);
    });
  });

  describe('create()', function() {
    it('creates a new record', async function() {
      const result = await controller.create({ name: chance.hash() }, {}, user);

      expect(result).to.exist;
    });
  });

  describe('find()', function() {
    it('returns all records', async function() {
      const result = await controller.find({}, user);

      expect(result.length).to.eql(1);
    });
  });

  describe('findOne()', function() {
    it('returns the record', async function() {
      const result = await controller.findOne(target.id, user);

      expect(result).to.exist;
    });
  });

  describe('remove()', function() {
    it('returns the removed record', async function() {
      const result = await controller.remove(target.id, user);

      expect(result).to.exist;
    });
  });

  describe('update()', function() {
    it('updates and returns the record', async function() {
      const record = await controller.update(target.id, { name: chance.hash() }, {}, user);

      expect(record).to.exist;
    });
  });
});
