import 'source-map-support/register';
import '@tenlastic/logging';

import { bandwidth } from './bandwidth';

(async () => {
  // Background Tasks.
  await bandwidth();
})();
