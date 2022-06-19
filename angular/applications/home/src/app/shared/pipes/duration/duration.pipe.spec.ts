import { DurationPipe } from './duration.pipe';

describe('DurationPipe', () => {
  let pipe: DurationPipe;

  beforeEach(() => {
    pipe = new DurationPipe();
  });

  it('returns the correct value', () => {
    const result = pipe.transform(1000 * 60 * 60 * 25.025);

    expect(result).toBe('1 Day(s), 1 Hour(s), 1 Minute(s), 30 Second(s)');
  });
});
