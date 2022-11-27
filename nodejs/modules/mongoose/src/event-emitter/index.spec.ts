import { expect } from 'chai';
import * as Chance from 'chance';
import * as sinon from 'sinon';

import { EventEmitter } from './';

const chance = new Chance();

describe('change-stream/event-emitter', function () {
  describe('emit()', function () {
    it('emits functions registered with async()', async function () {
      const eventEmitter = new EventEmitter();

      const spy = sinon.spy();
      const stub = async (value: string) => {
        await new Promise((resolve) => setTimeout(resolve, 0));
        return spy(value);
      };
      eventEmitter.async(stub);

      const hash = chance.hash();
      await eventEmitter.emit(hash);
      await eventEmitter.emit(hash);

      expect(spy.calledTwice).to.eql(true);
      expect(spy.getCall(0).args[0]).to.eql(hash);
      expect(spy.getCall(1).args[0]).to.eql(hash);
    });

    it('emits functions registered with sync()', async function () {
      const eventEmitter = new EventEmitter();

      const spy = sinon.spy();
      const stub = (value: string) => spy(value);
      eventEmitter.sync(stub);

      const hash = chance.hash();
      await eventEmitter.emit(hash);
      await eventEmitter.emit(hash);

      expect(spy.calledTwice).to.eql(true);
      expect(spy.getCall(0).args[0]).to.eql(hash);
      expect(spy.getCall(1).args[0]).to.eql(hash);
    });
  });
});
