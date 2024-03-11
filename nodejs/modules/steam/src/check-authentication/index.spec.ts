import { expect } from 'chai';
import { Chance } from 'chance';
import * as sinon from 'sinon';

import * as request from '../request';
import { checkAuthentication } from './';

const chance = new Chance();

describe('get-partner-app-list-for-web-api-key', function () {
  let sandbox: sinon.SinonSandbox;

  beforeEach(function () {
    sandbox = sinon.createSandbox();
  });

  afterEach(function () {
    sandbox.restore();
  });

  it('returns false', async function () {
    sandbox.stub(request, 'request').resolves({ data: 'is_valid:false', status: 200 });

    const response = await checkAuthentication({
      assocHandle: chance.hash(),
      claimedId: chance.hash(),
      identity: chance.hash(),
      responseNonce: chance.hash(),
      returnTo: chance.hash(),
      sig: chance.hash(),
      signed: chance.hash(),
    });

    expect(response).to.eql(false);
  });

  it('returns true', async function () {
    sandbox.stub(request, 'request').resolves({ data: 'is_valid:true', status: 200 });

    const response = await checkAuthentication({
      assocHandle: chance.hash(),
      claimedId: chance.hash(),
      identity: chance.hash(),
      responseNonce: chance.hash(),
      returnTo: chance.hash(),
      sig: chance.hash(),
      signed: chance.hash(),
    });

    expect(response).to.eql(true);
  });
});
