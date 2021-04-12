import { expect } from 'chai';

import { decrementalValidator } from './';

describe('validators/decremental', function() {
  describe('validator', function() {
    it('returns true', function() {
      const object = { _original: { replicas: 1 } };
      const { validator } = decrementalValidator('replicas');
      const result = validator.bind(object)(1);

      expect(result).to.eql(true);
    });

    it('returns true', function() {
      const object = { replicas: 1 };
      const { validator } = decrementalValidator('replicas');
      const result = validator.bind(object)(1);

      expect(result).to.eql(true);
    });

    it('returns false', function() {
      const object = { _original: { replicas: 2 } };
      const { validator } = decrementalValidator('replicas');
      const result = validator.bind(object)(1);

      expect(result).to.eql(false);
    });
  });
});
