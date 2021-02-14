import * as sinon from 'sinon';

import { Build } from './';

let sandbox: sinon.SinonSandbox;

beforeEach(function() {
  sandbox = sinon.createSandbox();

  sandbox.stub(Build, 'create').resolves();
  sandbox.stub(Build, 'delete').resolves();
});

afterEach(function() {
  sandbox.restore();
});
