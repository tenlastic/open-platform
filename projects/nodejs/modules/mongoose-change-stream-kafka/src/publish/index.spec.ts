import { IDatabasePayload } from '@tenlastic/mongoose-change-stream';
import { expect } from 'chai';
import * as Chance from 'chance';
import { ConsumerGroup } from 'kafka-node';

import { publish } from './';

const chance = new Chance();

describe('publish()', function() {
  this.timeout(5000);

  it('publishes the payload to Kafka', async function() {
    const payload: IDatabasePayload<any> = {
      documentKey: { _id: chance.hash() },
      fullDocument: { _id: chance.hash(), createdAt: new Date(), updatedAt: new Date() },
      ns: { coll: chance.hash({ length: 16 }), db: chance.hash({ length: 16 }) },
      operationType: 'insert',
    };

    await publish(payload);

    return new Promise(resolve => {
      const { coll, db } = payload.ns;
      const topic = `${db}.${coll}`;

      const consumerGroup = new ConsumerGroup(
        {
          kafkaHost: process.env.KAFKA_CONNECTION_STRING,
          groupId: 'ExampleTestGroup',
          protocol: ['roundrobin'],
          fromOffset: 'earliest',
        },
        topic,
      );

      consumerGroup.on('error', console.error);
      consumerGroup.on('message', msg => {
        const value = JSON.parse(msg.value as string);

        expect(value.documentKey).to.eql(payload.documentKey);
        expect(value.fullDocument).to.exist;
        expect(value.ns).to.eql(payload.ns);
        expect(value.operationType).to.eql(payload.operationType);

        return resolve();
      });
    });
  });
});
