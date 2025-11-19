import { expect } from 'chai';
import { Chance } from 'chance';
import * as sinon from 'sinon';

import * as request from '../request';
import { authenticateUserTicket } from './';

const chance = new Chance();

describe('authenticate-user-ticket', function () {
  afterEach(function () {
    sinon.restore();
  });

  it('returns User from Steam', async function () {
    const data = {
      response: {
        params: {
          ownersteamid: chance.hash(),
          publisherbanned: chance.bool(),
          result: chance.hash(),
          steamid: chance.hash(),
          vacbanned: chance.bool(),
        },
      },
    };
    sinon.stub(request, 'request').resolves({ data, status: 200 });

    const response = await authenticateUserTicket({
      appId: chance.integer(),
      key: chance.hash(),
      ticket: chance.hash(),
    });

    expect(response.data).to.eql(data);
  });
});
