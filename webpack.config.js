/*
 * GPLv3 https://www.gnu.org/licenses/gpl-3.0.en.html
 *
 * Author: eidng8
 */

const path = require('path');
// const Uglify = require('uglifyjs-webpack-plugin');
const Clean = require('clean-webpack-plugin').CleanWebpackPlugin;

module.exports = {
  mode: 'production',
  entry: {
    index: './src/index.ts',
  },
  output: {
    path: path.resolve(__dirname, 'lib'),
    filename: '[name].js',
    libraryTarget: 'commonjs',
    // libraryTarget: 'umd',
    // library: 'G8XmlPatch',
    // umdNamedDefine: true,
    // globalObject: 'this',
  },
  resolve: {
    extensions: ['.ts', '.tsx', '.js'],
  },
  externals: ['fs', 'iconv-lite', 'xmldom-ts', 'xpath-ts'],
  module: {
    rules: [
      {
        test: /\.ts$/,
        loader: 'babel-loader',
        exclude: [/node_modules/],
      },
    ],
  },
  // optimization: {
  //   minimizer: [new Uglify()],
  // },
  plugins: [new Clean()],
};
