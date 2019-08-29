import { expect } from 'chai';
import * as Chance from 'chance';

import { consume } from '../consume/consume';
import { publish } from './publish';

const chance = new Chance();

describe('publish', function() {
  it('publishes a message to RabbitMQ', async function() {
    const queue = chance.hash();
    const msg = { key: 'value' };

    await publish(queue, msg);

    return new Promise(resolve => {
      consume(queue, (channel, content, message) => {
        expect(content.key).to.eql('value');
        expect(message.properties.headers['x-original-queue']).to.eql(queue);

        resolve();
      });
    });
  });
});
