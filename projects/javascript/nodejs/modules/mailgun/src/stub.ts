import { SinonSandbox } from 'sinon';

import mailgun from './';

export function stub(sandbox: SinonSandbox) {
  sandbox.stub(mailgun, 'send').resolves();
}
