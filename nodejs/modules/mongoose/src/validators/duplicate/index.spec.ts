import { expect } from 'chai';

import { duplicateValidator } from './';

describe('validators/duplicate', function () {
  it('returns true', function () {
    const { validator } = duplicateValidator;
    const result = validator([0, 1, 2, 3, 4]);

    expect(result).to.eql(true);
  });

  it('returns false', function () {
    const { validator } = duplicateValidator;
    const result = validator([0, 1, 2, 3, 0]);

    expect(result).to.eql(false);
  });
});
