// Karma configuration file, see link for more information
// https://karma-runner.github.io/1.0/config/configuration-file.html

module.exports = function (config) {
  config.set({
    autoWatch: true,
    basePath: '',
    browserNoActivityTimeout: 5 * 60 * 1000,
    browsers: ['ChromeHeadless'],
    client: {
      clearContext: false, // leave Jasmine Spec Runner output visible in browser
    },
    colors: true,
    coverageReporter: {
      dir: require('path').join(__dirname, './coverage'),
      reporters: [
        { type: 'html', subdir: 'report-html' },
        { type: 'lcov', subdir: 'report-lcov' },
      ],
      fixWebpackSourcePaths: true,
    },
    customLaunchers: {
      ChromeHeadless: {
        base: 'Chrome',
        flags: ['--disable-gpu', '--headless', '--no-sandbox', '--remote-debugging-port=9222'],
      },
    },
    failOnEmptyTestSuite: false,
    frameworks: ['jasmine', '@angular-devkit/build-angular'],
    logLevel: config.LOG_INFO,
    plugins: [
      require('karma-jasmine'),
      require('karma-chrome-launcher'),
      require('karma-jasmine-html-reporter'),
      require('karma-coverage'),
      require('karma-mocha-reporter'),
      require('@angular-devkit/build-angular/plugins/karma'),
    ],
    port: 9876,
    reporters: ['mocha'],
    singleRun: false,
  });
};
