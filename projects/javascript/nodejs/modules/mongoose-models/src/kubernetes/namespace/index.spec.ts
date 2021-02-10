import * as sinon from 'sinon';

import { Namespace } from './';

let sandbox: sinon.SinonSandbox;

beforeEach(function() {
  sandbox = sinon.createSandbox();

  sandbox.stub(Namespace, 'create').resolves();
  sandbox.stub(Namespace, 'delete').resolves();
});

afterEach(function() {
  sandbox.restore();
});
