import { expect } from 'chai';
import { Chance } from 'chance';
import * as sinon from 'sinon';

import * as request from '../request';
import { getPartnerAppListForWebApiKey } from './';

const chance = new Chance();

describe('get-partner-app-list-for-web-api-key', function () {
  let sandbox: sinon.SinonSandbox;

  beforeEach(function () {
    sandbox = sinon.createSandbox();
  });

  afterEach(function () {
    sandbox.restore();
  });

  it('returns App List from Steam', async function () {
    const app = { app_name: chance.hash(), app_type: chance.hash(), appid: chance.integer() };
    sandbox
      .stub(request, 'request')
      .resolves({ data: { applist: { apps: { app: [app] } } }, status: 200 });

    const response = await getPartnerAppListForWebApiKey({ key: chance.hash() });

    expect(response.data.applist.apps.app[0]).to.eql(app);
  });
});
