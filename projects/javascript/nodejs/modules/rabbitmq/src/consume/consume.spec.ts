import { expect } from 'chai';
import * as Chance from 'chance';

import { publish } from '../publish/publish';
import { consume } from './consume';

const chance = new Chance();

describe('consume', function() {
  it('consumes a message from RabbitMQ', async function() {
    const queue = chance.hash();
    const msg = { key: 'value' };

    await publish(queue, msg);

    return new Promise(resolve => {
      consume(queue, (channel, content) => {
        expect(content.key).to.eql('value');

        resolve();
      });
    });
  });
});
