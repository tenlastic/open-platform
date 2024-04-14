import { expect } from 'chai';
import { Chance } from 'chance';
import * as sinon from 'sinon';

import * as request from '../request';
import { getPlayerSummaries } from './';

const chance = new Chance();

describe('get-player-summaries', function () {
  let sandbox: sinon.SinonSandbox;

  beforeEach(function () {
    sandbox = sinon.createSandbox();
  });

  afterEach(function () {
    sandbox.restore();
  });

  it('returns Player Summaries from Steam', async function () {
    const player = { personaname: chance.hash(), steamid: chance.hash() };
    sandbox
      .stub(request, 'request')
      .resolves({ data: { response: { players: [player] } }, status: 200 });

    const response = await getPlayerSummaries({ key: chance.hash(), steamIds: [player.steamid] });

    expect(response.data.response.players[0]).to.eql(player);
  });
});
