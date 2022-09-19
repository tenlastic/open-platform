import { WebServer } from '@tenlastic/web-server';

import { bandwidth } from './bandwidth';

(async () => {
  // Background Tasks.
  await bandwidth();
})();
