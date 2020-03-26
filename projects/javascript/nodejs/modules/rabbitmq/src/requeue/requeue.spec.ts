import { expect, use } from 'chai';
import * as Chance from 'chance';
import * as sinon from 'sinon';

import { consume } from '../consume/consume';
import { publish } from '../publish/publish';
import { requeue } from './requeue';

const chance = new Chance();

describe('requeue', function() {
  let sandbox: sinon.SinonSandbox;

  beforeEach(function() {
    sandbox = sinon.createSandbox();
  });

  afterEach(function() {
    sandbox.restore();
  });

  context('when the message should not be retried', function() {
    it('returns false', async function() {
      const msg = { key: 'value' };
      const queue = chance.hash();

      await publish(queue, msg);

      return new Promise((resolve, reject) => {
        consume(queue, async (channel, content, message) => {
          try {
            const result = await requeue(channel, message, { retries: 0 });
            expect(result).to.eql(false);

            resolve();
          } catch (e) {
            reject(e);
          }
        });
      });
    });

    it('does not publish the message to another queue', async function() {
      const msg = { key: 'value' };
      const queue = chance.hash();

      await publish(queue, msg);

      return new Promise((resolve, reject) => {
        consume(queue, async (channel, content, message) => {
          try {
            const ackStub = sandbox.stub(channel, 'ack');
            const sendToQueueStub = sandbox.stub(channel, 'sendToQueue');

            await requeue(channel, message, { retries: 0 });

            expect(ackStub.calledOnce).to.eql(true);
            expect(sendToQueueStub.calledOnce).to.eql(false);

            resolve();
          } catch (e) {
            reject(e);
          }
        });
      });
    });
  });

  context('when the message should be retried', function() {
    it('returns true', async function() {
      const msg = { key: 'value' };
      const queue = chance.hash();

      await publish(queue, msg);

      return new Promise((resolve, reject) => {
        consume(queue, async (channel, content, message) => {
          try {
            const result = await requeue(channel, message, { delay: 60 });
            expect(result).to.eql(true);

            resolve();
          } catch (e) {
            reject(e);
          }
        });
      });
    });

    context('when the message should be delayed', function() {
      it('publishes the message to a TTL queue', async function() {
        const msg = { key: 'value' };
        const queue = chance.hash();

        await publish(queue, msg);

        return new Promise((resolve, reject) => {
          consume(queue, async (channel, content, message) => {
            try {
              const ackStub = sandbox.stub(channel, 'ack');
              const assertQueueStub = sandbox.stub(channel, 'assertQueue').resolves();
              const sendToQueueStub = sandbox.stub(channel, 'sendToQueue');

              await requeue(channel, message, { delay: 60 });

              expect(ackStub.calledOnce).to.eql(true);
              expect(assertQueueStub.getCall(0).args[0]).to.eql(`${queue}-ttl`);
              expect(sendToQueueStub.getCall(0).args[0]).to.eql(`${queue}-ttl`);

              resolve();
            } catch (e) {
              reject(e);
            }
          });
        });
      });
    });

    context('when the message should not be delayed', function() {
      it('publishes the message back to the original queue', async function() {
        const msg = { key: 'value' };
        const queue = chance.hash();

        await publish(queue, msg);

        return new Promise((resolve, reject) => {
          consume(queue, async (channel, content, message) => {
            try {
              const ackStub = sandbox.stub(channel, 'ack');
              const assertQueueStub = sandbox.stub(channel, 'assertQueue');
              const publishStub = sandbox.stub(channel, 'publish');

              await requeue(channel, message, { delay: 0 });

              expect(ackStub.calledOnce).to.eql(true);
              expect(assertQueueStub.getCall(0).args[0]).to.eql(queue);
              expect(publishStub.getCall(0).args[0]).to.eql(queue);

              resolve();
            } catch (e) {
              reject(e);
            }
          });
        });
      });
    });
  });
});
