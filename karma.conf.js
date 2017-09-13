require('dotenv').config();

const isCI = !!process.env.CI;

module.exports = function(config) {
  const customLaunchers = {};

  // Mobile devices
  [
    ['iOS', '8.4', 'Safari', 'iPhone 6 Simulator'],
    ['iOS', '9.3', 'Safari', 'iPhone 6s Simulator'],
    ['iOS', '10.3', 'Safari', 'iPhone 6s Simulator'],
    ['Android', '4.4', 'Browser', 'Android Emulator'],
    ['Android', '5.0', 'Browser', 'Android Emulator'],
    ['Android', '5.1', 'Browser', 'Android Emulator'],
    ['Android', '6.0', 'Chrome', 'Android Emulator'],
  ].forEach(([p, v, b, d]) => {
    // prettier-ignore
    const k = `sl_${p}_${b}_${v}`.replace(/[^a-z0-9]/gi, '_').toLowerCase();
    customLaunchers[k] = {
      name: `${b}, ${p} ${v}`,
      platformName: p,
      platformVersion: v,
      browserName: b,
      deviceName: d,
      deviceOrientation: 'portrait',
      appiumVersion: '1.6.4',
    };
  });

  // IE and Safari
  [
    ['Windows 8.1', 'Internet Explorer', '11.0'],
    ['Windows 8', 'Internet Explorer', '10.0'],
    ['Windows 7', 'Internet Explorer', '9.0'],
    ['macOS 10.12', 'Safari', '10.0'],
    ['OS X 10.11', 'Safari', '9.0'],
    ['OS X 10.10', 'Safari', '8.0'],
    ['OS X 10.9', 'Safari', '7.0'],
  ].forEach(([p, b, v]) => {
    // prettier-ignore
    const k = `sl_${p}_${b}_${v}`.replace(/[^a-z0-9]/gi, '_').toLowerCase();
    customLaunchers[k] = {
      name: `${b} ${v}, ${p}`,
      browserName: b,
      version: v,
      platform: p,
    };
  });

  // Chrome, Firefox, and Edge latest
  ['Chrome', 'Firefox', 'MicrosoftEdge'].forEach(b => {
    const total = b === 'MicrosoftEdge' ? 3 : 4;
    const niceName = b === 'MicrosoftEdge' ? 'Edge' : b;
    for (let idx = -1; ++idx < total; ) {
      const k = `sl_win10_${b}_latest${idx > 0 ? `_${idx}` : ''}`.toLowerCase();
      const version = `latest${idx > 0 ? `-${idx}` : ''}`;
      customLaunchers[k] = {
        name: `${niceName} ${version}, Windows 10`,
        browserName: b,
        version,
        platform: 'Windows 10',
      };
    }
  });

  const testPrefix = isCI
    ? 'Travis ' + process.env.TRAVIS_EVENT_TYPE.replace(/_/g, ' ')
    : 'Local test';

  // gross
  const tzOffset = new Date().getTimezoneOffset();
  const [dateString, timeString] = new Date(Date.now() - tzOffset * 60000)
    .toISOString()
    .split(/[T.]/);
  const when = ` @ ${dateString} ${timeString} GMT${-tzOffset / 60}: `;

  for (const k in customLaunchers) {
    customLaunchers[k].base = 'SauceLabs';
    customLaunchers[k].name = testPrefix + when + customLaunchers[k].name;
  }

  let tunnelIdentifier;
  if (isCI) {
    tunnelIdentifier = process.env.TRAVIS_JOB_NUMBER;
  }

  config.set({
    frameworks: ['jasmine'],
    customLaunchers,
    browsers: Object.keys(customLaunchers),
    // LOG_DISABLE, LOG_ERROR, LOG_WARN, LOG_INFO, LOG_DEBUG
    logLevel: config.LOG_INFO,
    port: 9876,
    colors: true,
    autoWatch: false,
    singleRun: true,
    concurrency: 5,
    files: ['tests/*.webpack.js'],
    reporters: ['progress', 'saucelabs'],
    preprocessors: {
      'tests/*.webpack.js': ['webpack', 'sourcemap'],
    },
    sauceLabs: {
      recordScreenshots: false,
      startConnect: !isCI,
      tunnelIdentifier,
      tags: isCI
        ? ['ci', 'travis:' + process.env.TRAVIS_EVENT_TYPE]
        : ['local'],
      connectOptions: {
        logfile: 'sauce_connect.log',
      },
    },
    webpackServer: {
      noInfo: true,
    },
    webpack: {
      devtool: 'inline-source-map',
      resolve: { alias: { jsxstyle: __dirname } },
      module: {
        rules: [
          {
            test: /\.js$/,
            exclude: /node_modules/,
            loader: 'babel-loader',
            options: {
              babelrc: false,
              presets: [
                [
                  'env',
                  {
                    targets: { browsers: ['last 2 versions'] },
                    modules: false,
                  },
                ],
                'react',
              ],
              plugins: [
                'transform-object-rest-spread',
                'transform-object-assign',
              ],
            },
          },
        ],
      },
    },
  });
};
