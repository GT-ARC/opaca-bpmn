var CopyPlugin = require('copy-webpack-plugin');

var path = require('path');

var webpack = require('webpack');

var packageJson = require('./package.json');

module.exports = {
  mode: 'development',
  entry: './src/app.js',
  output: {
    path: path.resolve(__dirname, 'public'),
    filename: 'app.js'
  },
  module: {
    rules: [
      {
        test: /\.bpmn$/,
        use: {
          loader: 'raw-loader'
        }
      }
    ]
  },
  plugins: [
    new CopyPlugin({
      patterns: [
        { from: 'src/index.html', to: '.' },
        { from: 'node_modules/bpmn-js/dist/assets', to: 'vendor/bpmn-js/assets' },
        { from: 'node_modules/@bpmn-io/properties-panel/dist/assets', to: 'vendor/@bpmn-io/properties-panel/assets' },
        { from: 'node_modules/bpmn-js-token-simulation/assets', to: 'vendor/bpmn-js-token-simulation/assets' },
        { from: 'resources/opaca-logo.png', to: 'resources' }
      ]
    }),
    new webpack.ContextReplacementPlugin(
        /datatypes/,
        path.resolve(__dirname, 'resources/datatypes'),
        false,
        /.*\.json$/
    ),
    new webpack.DefinePlugin({
      'process.env.LLM_BACKEND': JSON.stringify(process.env.LLM_BACKEND),
      'process.env.APP_VERSION': JSON.stringify(packageJson.version),
      'process.env.BUILD_DATE': JSON.stringify(new Date().toISOString().split('T')[0])
    })
  ],
  devtool: 'source-map'
};