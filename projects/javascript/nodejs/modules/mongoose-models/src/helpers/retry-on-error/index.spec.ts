import { expect, use } from 'chai';
import * as chaiAsPromised from 'chai-as-promised';
import { retryOnError } from './';

use(chaiAsPromised);

describe('helpers/retry-on-error', function() {
  it('retries until successful', async function() {
    let count = 0;
    const callback = async () => {
      if (count < 1) {
        count++;
        throw new Error(`Count is ${count}.`);
      } else {
        return true;
      }
    };

    const result = await retryOnError(1, 3, () => callback());

    expect(result).to.eql(true);
  });

  it('throws the error after threshold', async function() {
    let count = 0;
    const callback = async () => {
      if (count < 3) {
        count++;
        throw new Error(`Count is ${count}.`);
      } else {
        return true;
      }
    };

    const result = retryOnError(1, 3, () => callback());

    return expect(result).to.be.rejectedWith('Count is 3.');
  });
});
