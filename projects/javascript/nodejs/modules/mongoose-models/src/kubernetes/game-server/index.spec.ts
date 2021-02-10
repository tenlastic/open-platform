import * as sinon from 'sinon';

import { GameServer } from './';

let sandbox: sinon.SinonSandbox;

beforeEach(function() {
  sandbox = sinon.createSandbox();

  sandbox.stub(GameServer, 'create').resolves();
  sandbox.stub(GameServer, 'delete').resolves();
});

afterEach(function() {
  sandbox.restore();
});
