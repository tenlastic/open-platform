import { FilesizePipe } from './filesize.pipe';

describe('FilesizePipe', () => {
  let pipe: FilesizePipe;

  beforeEach(() => {
    pipe = new FilesizePipe();
  });

  it('returns the correct value', () => {
    const result = pipe.transform(2000);

    expect(result).toBe('2.00 KB');
  });
});
