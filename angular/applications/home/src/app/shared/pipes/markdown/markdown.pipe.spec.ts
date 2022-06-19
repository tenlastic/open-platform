import { MarkdownPipe } from './markdown.pipe';

describe('MarkdownPipe', () => {
  let pipe: MarkdownPipe;

  beforeEach(() => {
    pipe = new MarkdownPipe();
  });

  it('converts markdown to html', () => {
    const result = pipe.transform(`# Heading `);

    expect(result).toBe('<h1>Heading</h1>\n');
  });
});
