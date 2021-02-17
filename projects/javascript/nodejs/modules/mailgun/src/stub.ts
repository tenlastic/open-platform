import { SinonSandbox } from 'sinon';

import * as mailgun from './';

export function stub(sandbox: SinonSandbox) {
  sandbox.stub(mailgun, 'send').resolves();
}
