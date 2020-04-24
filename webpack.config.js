/*
 * GPLv3 https://www.gnu.org/licenses/gpl-3.0.en.html
 *
 * Author: eidng8
 */

const path = require('path');
const WBA = require('webpack-bundle-analyzer').BundleAnalyzerPlugin;
const BundleAnalyzerPlugin = require('@bundle-analyzer/webpack-plugin');

const plugins = [];
if (process.env.WBA) {
  plugins.push(new WBA({ analyzerMode: 'static' }));
}
if (process.env.BUNDLE_ANALYZER_TOKEN) {
  plugins.push(
    new BundleAnalyzerPlugin({ token: process.env.BUNDLE_ANALYZER_TOKEN }),
  );
}

module.exports = {
  mode: 'production',
  entry: {
    index: './src/index.ts',
  },
  output: {
    path: path.resolve(__dirname, 'lib'),
    filename: '[name].js',
    libraryTarget: 'commonjs',
  },
  resolve: {
    extensions: ['.ts', '.tsx', '.js'],
  },
  externals: ['fs', 'iconv-lite', 'pretty-data', 'xmldom-ts', 'xpath-ts'],
  module: {
    rules: [
      {
        test: /\.ts$/,
        loader: 'babel-loader',
        exclude: [/node_modules/],
      },
    ],
  },
  plugins,
};
