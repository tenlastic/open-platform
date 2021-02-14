import * as sinon from 'sinon';

import { BuildSidecar } from './';

let sandbox: sinon.SinonSandbox;

beforeEach(function() {
  sandbox = sinon.createSandbox();

  sandbox.stub(BuildSidecar, 'create').resolves();
  sandbox.stub(BuildSidecar, 'delete').resolves();
});

afterEach(function() {
  sandbox.restore();
});
