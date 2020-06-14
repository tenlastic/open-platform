import { TruncatePipe } from './truncate.pipe';

describe('TruncatePipe', () => {
  let pipe: TruncatePipe;

  beforeEach(() => {
    pipe = new TruncatePipe();
  });

  describe('when completeWords is true', () => {
    it('truncates at the last complete word', () => {
      const result = pipe.transform('a really long string', 10, true);

      expect(result).toBe('a really...');
    });

    it('does not truncate a string shorter than the limit', () => {
      const result = pipe.transform('a really long string', 25, true);

      expect(result).toBe('a really long string');
    });
  });

  describe('when the string is longer than the limit', () => {
    it('truncates with an ellipsis', () => {
      const result = pipe.transform('a really long string', 5, false);

      expect(result).toBe('a rea...');
    });
  });

  describe('when the string is not longer than the limit', () => {
    it('does not change the string', () => {
      const result = pipe.transform('a really long string', 25, false);

      expect(result).toBe('a really long string');
    });
  });

  describe('when the string is empty', () => {
    it('does not change the value', () => {
      const result = pipe.transform('', 25, false);

      expect(result).toBe('');
    });
  });
});
