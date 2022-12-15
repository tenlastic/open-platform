import { expect } from 'chai';
import { Chance } from 'chance';
import * as sinon from 'sinon';

import { MigrationModel } from './';

const chance = new Chance();

describe('model', function () {
  describe(`pre('delete')`, function () {
    it('calls down()', async function () {
      const migration = new MigrationModel({ name: chance.hash(), timestamp: new Date() });
      await migration.save();

      const spy = sinon.spy();
      migration.down = (m) => spy(m);

      await migration.remove();

      expect(spy.calledOnceWith(migration)).to.eql(true);
    });
  });

  describe(`pre('save')`, function () {
    it('calls up()', async function () {
      const migration = new MigrationModel({ name: chance.hash(), timestamp: new Date() });

      const spy = sinon.spy();
      migration.up = (m) => spy(m);

      await migration.save();

      expect(spy.calledOnceWith(migration)).to.eql(true);
    });
  });
});
