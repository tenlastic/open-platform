import { expect } from 'chai';
import * as mongoose from 'mongoose';

import { duplicateValidator } from './';

describe('validators/duplicate', function () {
  it('returns true', function () {
    const { validator } = duplicateValidator;
    const result = validator([0, 1, 2, 3, 4]);

    expect(result).to.eql(true);
  });

  it('returns true with ObjectIds', function () {
    const { validator } = duplicateValidator;
    const result = validator([new mongoose.Types.ObjectId(), new mongoose.Types.ObjectId()]);

    expect(result).to.eql(true);
  });

  it('returns false', function () {
    const { validator } = duplicateValidator;
    const result = validator([0, 1, 2, 3, 0]);

    expect(result).to.eql(false);
  });

  it('returns false with ObjectIds', function () {
    const objectId = new mongoose.Types.ObjectId();

    const { validator } = duplicateValidator;
    const result = validator([objectId, objectId]);

    expect(result).to.eql(false);
  });
});
