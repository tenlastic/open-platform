import { EventEmitter } from 'events';
import { SinonSandbox } from 'sinon';

import { PodApiV1 } from './';

export function stub(sandbox: SinonSandbox) {
  sandbox.stub(PodApiV1.prototype, 'readNamespacedPodLog').returns(new EventEmitter());
}
