import { IDatabasePayload } from '@tenlastic/mongoose-models';
import * as nats from '@tenlastic/nats';
import { expect } from 'chai';
import * as Chance from 'chance';
import { TextDecoder } from 'util';

import { publish } from './';

const chance = new Chance();

describe('publish()', function () {
  it('publishes the payload to NATS', async function () {
    const payload: IDatabasePayload<any> = {
      documentKey: { _id: chance.hash() },
      fullDocument: { _id: chance.hash(), createdAt: new Date(), updatedAt: new Date() },
      ns: { coll: chance.hash({ length: 16 }), db: 'mongoose-change-stream-nats' },
      operationType: 'insert',
    };

    const subscription = await nats.subscribe(chance.hash(), `${payload.ns.db}.${payload.ns.coll}`);
    await publish(payload);

    for await (const message of subscription) {
      const data = new TextDecoder().decode(message.data);
      const json = JSON.parse(data);

      expect(json.documentKey).to.eql(payload.documentKey);
      expect(json.fullDocument._id).to.eql(payload.fullDocument._id);
      expect(json.ns).to.eql(payload.ns);
      expect(json.operationType).to.eql(payload.operationType);

      break;
    }
  });
});
