import * as sinon from 'sinon';

import { BuildWorkflow } from './';

let sandbox: sinon.SinonSandbox;

beforeEach(function() {
  sandbox = sinon.createSandbox();

  sandbox.stub(BuildWorkflow, 'create').resolves();
  sandbox.stub(BuildWorkflow, 'delete').resolves();
});

afterEach(function() {
  sandbox.restore();
});
