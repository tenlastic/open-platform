import * as sinon from 'sinon';

import { WorkflowSidecar } from './';

let sandbox: sinon.SinonSandbox;

beforeEach(function() {
  sandbox = sinon.createSandbox();

  sandbox.stub(WorkflowSidecar, 'create').resolves();
  sandbox.stub(WorkflowSidecar, 'delete').resolves();
});

afterEach(function() {
  sandbox.restore();
});
