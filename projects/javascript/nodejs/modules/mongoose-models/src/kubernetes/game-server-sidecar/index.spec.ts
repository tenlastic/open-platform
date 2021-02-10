import * as sinon from 'sinon';

import { GameServerSidecar } from './';

let sandbox: sinon.SinonSandbox;

beforeEach(function() {
  sandbox = sinon.createSandbox();

  sandbox.stub(GameServerSidecar, 'create').resolves();
  sandbox.stub(GameServerSidecar, 'delete').resolves();
});

afterEach(function() {
  sandbox.restore();
});
