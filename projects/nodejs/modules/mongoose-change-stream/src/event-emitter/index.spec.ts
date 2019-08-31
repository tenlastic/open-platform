import { expect } from 'chai';
import * as Chance from 'chance';
import * as sinon from 'sinon';

import { EventEmitter } from './';

const chance = new Chance();

describe('event-emitter', function() {
  describe('emit()', function() {
    it('emits functions registered with on()', async function() {
      const eventEmitter = new EventEmitter();

      const spy = sinon.spy();
      const stub = async (value: string) => {
        await new Promise(resolve => setTimeout(resolve, 0));
        return spy(value);
      };
      eventEmitter.on(stub);

      const hash = chance.hash();
      await eventEmitter.emit(hash);
      await eventEmitter.emit(hash);

      expect(spy.calledTwice).to.eql(true);
      expect(spy.getCall(0).args[0]).to.eql(hash);
      expect(spy.getCall(1).args[0]).to.eql(hash);
    });

    it('emits functions registered with once()', async function() {
      const eventEmitter = new EventEmitter();

      const spy = sinon.spy();
      const stub = async (value: string) => {
        await new Promise(resolve => setTimeout(resolve, 0));
        return spy(value);
      };
      eventEmitter.once(stub);

      const hash = chance.hash();
      await eventEmitter.emit(hash);
      await eventEmitter.emit(hash);

      expect(spy.calledOnce).to.eql(true);
      expect(spy.getCall(0).args[0]).to.eql(hash);
    });

    it('preserves the ordering of on() and once()', async function() {
      const eventEmitter = new EventEmitter();

      const spy = sinon.spy();
      const on = async () => {
        await new Promise(resolve => setTimeout(resolve, 0));
        return spy('on');
      };
      const once = async () => {
        await new Promise(resolve => setTimeout(resolve, 0));
        return spy('once');
      };
      eventEmitter.on(on);
      eventEmitter.once(once);
      eventEmitter.on(on);

      await eventEmitter.emit();

      expect(spy.calledThrice).to.eql(true);
      expect(spy.getCall(0).args[0]).to.eql('on');
      expect(spy.getCall(1).args[0]).to.eql('once');
      expect(spy.getCall(2).args[0]).to.eql('on');
    });

    it('does not emit functions removed with off()', async function() {
      const eventEmitter = new EventEmitter();

      const spy = sinon.spy();
      const on = async () => {
        await new Promise(resolve => setTimeout(resolve, 0));
        return spy('on');
      };
      const once = async () => {
        await new Promise(resolve => setTimeout(resolve, 0));
        return spy('once');
      };
      eventEmitter.on(on);
      eventEmitter.once(once);
      eventEmitter.on(on);
      eventEmitter.off(once);

      await eventEmitter.emit();

      expect(spy.calledTwice).to.eql(true);
      expect(spy.getCall(0).args[0]).to.eql('on');
      expect(spy.getCall(1).args[0]).to.eql('on');
    });
  });
});
