import * as kafka from '@tenlastic/kafka';
import { IDatabasePayload } from '@tenlastic/mongoose-change-stream';
import { expect } from 'chai';
import * as Chance from 'chance';
import * as sinon from 'sinon';

import { publish } from './';

const chance = new Chance();

describe('publish()', function() {
  let sandbox: sinon.SinonSandbox;

  beforeEach(function() {
    sandbox = sinon.createSandbox();
  });

  afterEach(function() {
    sandbox.restore();
  });

  it('publishes the payload to Kafka', async function() {
    const payload: IDatabasePayload<any> = {
      documentKey: { _id: chance.hash() },
      fullDocument: { _id: chance.hash(), createdAt: new Date(), updatedAt: new Date() },
      ns: { coll: chance.hash({ length: 16 }), db: chance.hash({ length: 16 }) },
      operationType: 'insert',
    };

    const stub = sandbox.stub(kafka.getProducer(), 'send').resolves();
    await publish(payload);

    expect(stub.calledOnce).to.eql(true);
    expect(stub.getCalls()[0].args[0]).to.eql({
      messages: [{ key: JSON.stringify(payload.documentKey), value: JSON.stringify(payload) }],
      topic: `${payload.ns.db}.${payload.ns.coll}`,
    });
  });
});
