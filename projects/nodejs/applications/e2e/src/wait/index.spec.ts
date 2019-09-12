import { expect, use } from 'chai';
import * as chaiAsPromised from 'chai-as-promised';

import * as index from './';

use(chaiAsPromised);

describe('wait()', function() {
  context('when the criteria returns true', function() {
    it('resolves', async function() {
      const criteria = async () => true;
      return index.wait(0, 0, criteria);
    });
  });

  context('when the criteria returns false', function() {
    context('when the duration is longer than the timeout', function() {
      it('throws an error', async function() {
        const criteria = async () => false;
        const promise = index.wait(0, 0, criteria);

        return expect(promise).to.be.rejectedWith('Criteria did not resolve within given timeout.');
      });
    });

    context('when the duration is not longer than the timeout', function() {
      it('waits for the criteria to be truthy', async function() {
        let calls = 0;

        const criteria = async () => {
          if (calls > 1) {
            return 1;
          }

          await new Promise(resolve => setTimeout(resolve, 10));
          calls++;

          return 0;
        };

        const result = await index.wait(0, 250, criteria);

        expect(result).to.eql(1);
        expect(calls).to.eql(2);
      });
    });
  });
});
