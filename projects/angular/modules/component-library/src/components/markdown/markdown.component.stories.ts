import { storiesOf } from '@storybook/angular';

import { MarkdownPipe } from '../../pipes/markdown/markdown.pipe';
import { MarkdownComponent } from './markdown.component';

storiesOf('Markdown', module).add('Primary', () => ({
  component: MarkdownComponent,
  moduleMetadata: {
    declarations: [MarkdownComponent, MarkdownPipe],
  },
  props: {
    markdown: `
\`This is inline code.\`
\`\`\`
This is a code block.
\`\`\`
# Heading 1
## Heading 2
### Heading 3
#### Heading 4
---
- List Item 1
- List Item 2
  - Indented List Item
- List Item 3

This is just a basic sentence.

[Link Item Text](http://localhost:3000/)
    `,
  },
  template: `<ten-markdown [markdown]="markdown"></ten-markdown>`,
}));
