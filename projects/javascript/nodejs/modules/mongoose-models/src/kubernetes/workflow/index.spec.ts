import * as sinon from 'sinon';

import { Workflow } from './';

let sandbox: sinon.SinonSandbox;

beforeEach(function() {
  sandbox = sinon.createSandbox();

  sandbox.stub(Workflow, 'create').resolves();
  sandbox.stub(Workflow, 'delete').resolves();
});

afterEach(function() {
  sandbox.restore();
});
