import { expect } from 'chai';
import { Chance } from 'chance';

import { ContextMock } from '../../context';
import { find } from './';

const chance = new Chance();

describe('handlers/find', function () {
  it('returns the matching records', async function () {
    const name = chance.hash();

    const ctx = new ContextMock();
    const Permissions = {
      find: () => Promise.resolve([{ name }]),
      read: () => Promise.resolve({ name }),
    };

    const handler = find(Permissions as any);
    await handler(ctx as any);

    expect(ctx.response.body.records.length).to.eql(1);
    expect(ctx.response.body.records[0]).to.eql({ name });
  });
});
