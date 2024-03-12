import { expect } from 'chai';
import { Chance } from 'chance';
import * as sinon from 'sinon';

import * as request from '../request';
import { checkAppOwnership } from './';

const chance = new Chance();

describe('check-app-ownership', function () {
  let sandbox: sinon.SinonSandbox;

  beforeEach(function () {
    sandbox = sinon.createSandbox();
  });

  afterEach(function () {
    sandbox.restore();
  });

  it('returns App Ownership from Steam', async function () {
    const appownership = {
      ownersteamid: chance.hash(),
      ownsapp: chance.bool(),
      permanent: chance.bool(),
      result: chance.hash(),
      sitelicense: chance.bool(),
      timedtrial: chance.bool(),
      timestamp: chance.hash(),
    };
    sandbox.stub(request, 'request').resolves({ data: { appownership }, status: 200 });

    const response = await checkAppOwnership({
      appId: chance.integer(),
      key: chance.hash(),
      steamId: chance.hash(),
    });

    expect(response.data.appownership).to.eql(appownership);
  });
});
