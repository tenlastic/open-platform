import * as nats from '@tenlastic/nats';
import { Chance } from 'chance';
import { ChangeStream } from 'mongodb';
import * as mongoose from 'mongoose';
import { DeliverPolicy } from 'nats';
import { TextDecoder } from 'util';

import { client, connection } from '../entrypoint.spec';
import { watch } from './';

const chance = new Chance();
const schema = new mongoose.Schema({ name: String }, { collection: 'examples' });
const Model = mongoose.model('Example', schema);

describe('watch', function () {
  let changeStream: ChangeStream;

  beforeEach(async function () {
    await Model.deleteMany();
    await nats.purgeStream('cdc-test.examples');
  });

  afterEach(async function () {
    await changeStream?.close();
  });

  it('handles many change events', async function () {
    // Start watching for changes.
    changeStream = watch(client, [], connection, 'cdc.resumeToken', null);

    // Insert records into MongoDB.
    const names = Array.from(Array(1000)).map(() => chance.hash());
    const operations = names.map((n) => ({ insertOne: { document: { name: n } } }));
    await Model.bulkWrite(operations);

    // Make sure records are received by NATS.
    const options = { deliver_policy: DeliverPolicy.All, durable_name: 'cdc' };
    const subscription = await nats.subscribe('cdc-test.examples', options);
    for await (const message of subscription) {
      const data = new TextDecoder().decode(message.data);
      const json = JSON.parse(data);

      const index = names.indexOf(json.fullDocument.name);
      names.splice(index, 1);

      if (names.length === 0) {
        await subscription.destroy();
      }
    }
  });
});
