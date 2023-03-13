module.exports = (config, options) => {
  config.target = 'electron-renderer';

  if (options?.customWebpackConfig?.target) {
    config.target = options?.customWebpackConfig?.target;
  }

  return config;
};
