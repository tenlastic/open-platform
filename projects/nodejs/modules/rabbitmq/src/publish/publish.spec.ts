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
      consume(queue, (channel, content, msg) => {
        expect(content.key).to.eql('value');

        resolve();
      });
    });
  });
});
