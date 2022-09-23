import { expect } from 'chai';
import { Chance } from 'chance';
import * as sinon from 'sinon';

import { Migration } from '../model';
import { down } from './';

const chance = new Chance();

describe('down', function () {
  context(`when migration exists`, function () {
    it('removes the migration', async function () {
      const migration = new Migration({ name: chance.hash(), timestamp: new Date() });
      await migration.save();

      const spy = sinon.spy();
      migration.remove = () => spy();

      await down(migration);

      expect(spy.calledOnce).to.eql(true);
    });
  });

  context(`when migration does not exist`, function () {
    it('does not remove the migration', async function () {
      const migration = new Migration({ name: chance.hash(), timestamp: new Date() });

      const spy = sinon.spy();
      migration.remove = () => spy();

      await down(migration);

      expect(spy.called).to.eql(false);
    });
  });
});
