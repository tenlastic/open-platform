import * as kafka from '@tenlastic/kafka';
import { IDatabasePayload } from '@tenlastic/mongoose-change-stream';
import { expect } from 'chai';
import * as Chance from 'chance';

import { publish } from './';

const chance = new Chance();

describe('publish()', function() {
  it('publishes the payload to Kafka', async function() {
    const payload: IDatabasePayload<any> = {
      documentKey: { _id: chance.hash() },
      fullDocument: { _id: chance.hash(), createdAt: new Date(), updatedAt: new Date() },
      ns: { coll: chance.hash({ length: 16 }), db: chance.hash({ length: 16 }) },
      operationType: 'insert',
    };

    await publish(payload);

    return new Promise(async resolve => {
      const { coll, db } = payload.ns;
      const topic = `${db}.${coll}`;

      const connection = kafka.getConnection();
      const consumer = connection.consumer({ groupId: 'example' });
      await consumer.connect();
      await consumer.subscribe({ fromBeginning: true, topic });

      await consumer.run({
        eachMessage: async ({ message }) => {
          const value = JSON.parse(message.value.toString());

          expect(value.documentKey).to.eql(payload.documentKey);
          expect(value.fullDocument).to.exist;
          expect(value.ns).to.eql(payload.ns);
          expect(value.operationType).to.eql(payload.operationType);

          return resolve();
        },
      });
    });
  });
});
