import { SumPipe } from './sum.pipe';

describe('SumPipe', () => {
  let pipe: SumPipe;

  beforeEach(() => {
    pipe = new SumPipe();
  });

  it('returns the correct value', () => {
    const result = pipe.transform([1, 2, 3]);

    expect(result).toBe(6);
  });

  it('returns the correct value', () => {
    const result = pipe.transform([{ value: 1 }, { value: 2 }], 'value');

    expect(result).toBe(3);
  });
});
