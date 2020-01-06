import { addParameters, configure } from '@storybook/angular';
import { themes } from '@storybook/theming';

import '!style-loader!css-loader!sass-loader!../src/assets/scss/index.scss';

// Option defaults.
addParameters({
  options: {
    theme: themes.dark,
  },
});

configure((require as any).context('../src', true, /\.stories\.[tj]s$/), module);
