'use strict';

const autoprefixer = require('autoprefixer');
const path = require('path');
const webpack = require('webpack');
const ExtractTextPlugin = require('extract-text-webpack-plugin');
const eslintFormatter = require('react-dev-utils/eslintFormatter');
const ProgressBarPlugin = require('progress-bar-webpack-plugin');
const chalk = require('chalk');
const Project = require('./utils/Project');
const FilterOutputPlugin = require('./plugins/FilterOutputPlugin');
const SftpOutputPlugin = require('./plugins/SftpOutputPlugin');
const HandleErrorsPlugin = require('./plugins/HandleErrorsPlugin')
const notifier = require('node-notifier');

var PrettyError = require('pretty-error');
var pe = new PrettyError();

// We create an object with the set up for the project
// This prevent us from reading the same files several times
const project = new Project();
const { config } = project;

// Bail out if there are not entries to watched
if (Object.keys(project.entries).length === 0 && project.entries.constructor === Object) {
  console.log( chalk.yellowBright('\n  No files to watch. Exiting the script...'));
  process.exit(0);
}

// We set up the webpack plugins here
// because we may or may not add additional plugins
// depending on the project config
let plugins = [
  // Note: this won't work without ExtractTextPlugin.extract(..) in `loaders`.
  new ExtractTextPlugin({
    filename: '[name].css'
  }),

  new webpack.optimize.UglifyJsPlugin({
    compress: {
      warnings: false,
      // Disabled because of an issue with Uglify breaking seemingly valid code:
      // https://github.com/facebookincubator/create-react-app/issues/2376
      // Pending further investigation:
      // https://github.com/mishoo/UglifyJS2/issues/2011
      comparisons: false,
    },
    output: {
      comments: false,
    },
    sourceMap: true,
  }),

  new FilterOutputPlugin(project.whitelist),

  new ProgressBarPlugin({
    format: chalk.cyan('  Compiling') + ' :bar' + chalk.green(' :percent') + ' :msg',
    clear: false,
    incomplete: chalk.dim('\u2588'),
    complete: chalk.green('\u2588'),
    summary: false,
    customSummary: function() {
      console.log(chalk.greenBright('  Build was successful.'));

      if (process.env.AMPLEFUTURE_UPLOAD === 'false') {
        console.log(chalk.gray('  Please note that the generated assets have not been uploaded'));
      }

      if (process.env.NODE_ENV === 'production') {
        notifier.notify({
          'title': 'Build was successful'
        });
      }

    }
  }),

  new HandleErrorsPlugin()

]

// Only upload if the environment is set to do so
if (process.env.AMPLEFUTURE_UPLOAD === 'true') {
  const { config } = project;
  if (config) {
    plugins.push( new SftpOutputPlugin({
      host: config.host,
      username: config.username,
      password: config.password,
      remotePath: path.join(config.remotePath, config.remoteFolder),
      localPath: project.paths.build,
      uploadOnFirstBuild: true,

    }));
  }
}

// This is the production configuration.
// It compiles only once and is slower to create the build
// The bundle will be minified and will produce source maps
module.exports = {

  // We generate sourcemaps in production. This is slow but gives good results.
  // You can exclude the *.map files from the build during deployment.
  devtool: 'source-map',

  // We load the files to be watched
  entry: project.entries,

  output: {
    // The build folder.
    path: project.paths.build,
    // Generated JS file names (with nested folders).
    // There will be one js file per entry
    filename: '[name].js',
    chunkFilename: '[name].[chunkhash:8].chunk.js',
  },
  resolve: {
    modules: ['node_modules'],
    // These are the reasonable defaults supported by the Node ecosystem.
    // We also include JSX as a common component filename extension to support
    // some tools, although we do not recommend using it, see:
    // https://github.com/facebookincubator/create-react-app/issues/290
    extensions: ['.js', '.json', '.jsx'],
  },
  module: {
    strictExportPresence: true,
    rules: [
      // First, run the linter.
      // It's important to do this before Babel processes the JS.
      {
        test: /\.(js|jsx)$/,
        include: path.join(project.paths.src,  './js'),
        enforce: 'pre',
        use: [
          {
            options: {
              formatter: eslintFormatter,
              // @remove-on-eject-begin
              // TODO: consider separate config for production,
              // e.g. to enable no-console and no-debugger only in production.
              baseConfig: {
                extends: [require.resolve('eslint-config-react-app')],
              },
              ignore: false,
              useEslintrc: false,
              // @remove-on-eject-end
            },
            loader: require.resolve('eslint-loader'),
          },
        ]
      },
      // Process JS with Babel.
      {
        test: /\.(js|jsx)$/,
        loader: require.resolve('babel-loader'),
        include: path.join(project.paths.src,  './js'),
        // @remove-on-eject-begin
        options: {
          babelrc: false,
          presets: [require.resolve('babel-preset-react-app')],
        },
        // @remove-on-eject-end
      },
      // The notation here is somewhat confusing.
      // "postcss" loader applies autoprefixer to our CSS.
      // "css" loader resolves paths in CSS and adds assets as dependencies.
      // "style" loader normally turns CSS into JS modules injecting <style>,
      // but unlike in development configuration, we do something different.
      // `ExtractTextPlugin` first applies the "postcss" and "css" loaders
      // (second argument), then grabs the result CSS and puts it into a
      // separate file in our build process. This way we actually ship
      // a single CSS file in production instead of JS code injecting <style>
      // tags. If you use code splitting, however, any async bundles will still
      // use the "style" loader inside the async code so CSS from them won't be
      // in the main CSS file.
      {
        test: /\.(css|scss|sass)$/,
        include: path.join(project.paths.src,  './styles'),
        loader: ExtractTextPlugin.extract(
          Object.assign(
            {
              fallback: require.resolve('style-loader'),
              use: [
                {
                  loader: require.resolve('css-loader'),
                  options: {
                    importLoaders: 1,
                    modules: true,
                    localIdentName: '[local]',
                    sourceMap: true,
                    minimize: true
                  },
                },
                {
                  loader: require.resolve('postcss-loader'),
                  options: {
                    sourceMap: true,
                    ident: 'postcss', // https://webpack.js.org/guides/migrating/#complex-options
                    plugins: () => [
                      require('postcss-flexbugs-fixes'),
                      autoprefixer({
                        browsers: [
                          '>1%',
                          'last 4 versions',
                          'Firefox ESR',
                          'not ie < 9', // React doesn't support IE8 anyway
                        ],
                        flexbox: 'no-2009',
                      }),
                    ],
                  },
                },
                {
                  loader: require.resolve('sass-loader'),
                  options: {
                    sourceMap: true
                  }
                }
              ],
            }
          )
        ),
      },
    ],
  },
  plugins,
  // Some libraries import Node modules but don't use them in the browser.
  // Tell Webpack to provide empty mocks for them so importing them works.
  node: {
    fs: 'empty',
    __filename: true,
    __dirname: true
  },
};
