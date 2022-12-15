import { expect } from 'chai';
import { Chance } from 'chance';
import * as sinon from 'sinon';

import { MigrationModel } from '../model';
import { up } from './';

const chance = new Chance();

describe('up', function () {
  context(`when migration exists`, function () {
    it('does not save the migration', async function () {
      const migration = new MigrationModel({ name: chance.hash(), timestamp: new Date() });
      await migration.save();

      const spy = sinon.spy();
      migration.save = () => spy();

      await up(migration);

      expect(spy.called).to.eql(false);
    });
  });

  context(`when migration does not exist`, function () {
    it('saves the migration', async function () {
      const migration = new MigrationModel({ name: chance.hash(), timestamp: new Date() });

      const spy = sinon.spy();
      migration.save = () => spy();

      await up(migration);

      expect(spy.calledOnce).to.eql(true);
    });
  });
});
